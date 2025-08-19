import fs from 'fs';
import path from 'path';
import db from '../../../../utils/db';
import { saveJsonToMinio } from '../minio/saveJsonToMinio';
import { minioClient } from '../../../../utils/minioClient';
import { 
  saveNewTemplateToDb, 
  saveVersionToDb, 
  generateTemplateKeyName,
  saveNewCategoryToDb,
  addTemplateToCategory
} from './saveToDb';

const AUTO_CREATED_TEMPLATES_DIR = path.join(process.cwd(), 'src', 'autoCreatedTemplates');

export async function autoCreateTemplatesForUser(userId: number, username: string) {
  try {
    const templateFiles = fs.readdirSync(AUTO_CREATED_TEMPLATES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        filename: file,
        name: file.replace('.json', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        path: path.join(AUTO_CREATED_TEMPLATES_DIR, file)
      }));

    const createdTemplates = [];
    let authenticationCategoryId = null;

    try {
      const categoryResult = await saveNewCategoryToDb('authentication', 'Authentication', userId);
      if (categoryResult.success) {
        authenticationCategoryId = categoryResult.category.id;
      }
    } catch (error) {
      try {
        const existingCategoryResult = await db.query(
          'SELECT id FROM categories WHERE key = $1 AND user_id = $2 AND deleted_at IS NULL',
          ['authentication', userId]
        );
        if (existingCategoryResult.rows.length > 0) {
          authenticationCategoryId = existingCategoryResult.rows[0].id;
        }
      } catch (getError) {
        // Continue without category if we can't find it
      }
    }

    for (const templateFile of templateFiles) {
      try {
        const templateData = JSON.parse(fs.readFileSync(templateFile.path, 'utf-8'));
        
        const templateName = templateFile.name;
        const keyName = generateTemplateKeyName(templateName);
        
        const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const bucket = `${safeUsername}`;
        const fileName = `document-${Date.now()}-${safeUsername}-${templateFile.filename}`;
        
        
        const minioResult = await saveJsonToMinio(bucket, fileName, templateData);
        
        if (!minioResult || !minioResult.url) {
          continue;
        }

        const templateResult = await saveNewTemplateToDb(keyName, templateName, userId);
        
        if (!templateResult.success) {
          continue;
        }

        const versionResult = await saveVersionToDb(
          templateResult.template.id, 
          templateName, 
          minioResult.url, 
          1
        );

        if (!versionResult.success) {
          continue;
        }

        if (authenticationCategoryId && 
            (templateFile.filename === 'reset-password.json' || 
             templateFile.filename === 'one-time-passcode.json')) {
          try {
            await addTemplateToCategory(templateResult.template.id, authenticationCategoryId);
          } catch (error) {
            // Continue even if category linking fails
          }
        }

        createdTemplates.push({
          name: templateName,
          template: templateResult.template,
          version: versionResult.version
        });
      } catch (error) {
        // Continue with next template if one fails
      }
    }

    return {
      success: true,
      createdTemplates,
      message: `Created ${createdTemplates.length} templates for user ${username}`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create templates for new user'
    };
  }
} 

export async function ensureUserBucketExists(username: string) {
  try {
    const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const bucket = `${safeUsername}`;
    
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
    }
    return { success: true, bucket };
  } catch (error) {
    return { success: false, error };
  }
} 

export async function ensureAllUserBucketsExist() {
  try {
    const result = await db.query('SELECT name FROM users WHERE deleted_at IS NULL');
    
    for (const row of result.rows) {
      await ensureUserBucketExists(row.name);
    }
    
  } catch (error) {
  }
} 