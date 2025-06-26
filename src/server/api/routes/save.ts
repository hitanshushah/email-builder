import { FastifyPluginAsync } from 'fastify';
import { saveJsonToMinio, deleteFileFromMinio, extractFileNameFromLink } from '../minio/saveJsonToMinio';
import { 
  checkTemplateKeyNameExists, 
  saveNewTemplateToDb, 
  getTemplateByKey,
  getNextVersionNumber,
  saveVersionToDb,
  generateTemplateKeyName
} from '../db/saveToDb';
import db from '../../../../utils/db';

const saveRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/save', async (request, reply) => {
    if (!request.user?.username || !request.user?.user_id) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { document, templateName, templateKey, useExistingName } = request.body as { 
      document: any, 
      templateName: string, 
      templateKey?: string,
      useExistingName?: boolean
    };
    const username = request.user.username;
    const userId = request.user.user_id;

    if (!templateName) {
      return reply.status(400).send({
        success: false,
        error: 'File name is required'
      });
    }

    const bucket = 'default-bucket';
    const fileName = `document-${Date.now()}-${username}.json`;
    
    try {
      // Save to MinIO first
      const res = await saveJsonToMinio(bucket, fileName, document);
      
      if (!res) {
        return { 
          success: false, 
          error: 'Failed to save to Minio', 
          file: fileName,
          username: username
        };
      }

      let templateId: number;
      let versionNo: number;
      let fileNameToSave: string;
      let templateDisplayName: string;

      if (templateKey) {
        // Template key exists - this is an update to existing template
        const templateResult = await getTemplateByKey(templateKey, userId);
        
        if (!templateResult.success || !templateResult.template) {
          return reply.status(404).send({
            success: false,
            error: 'Template not found'
          });
        }

        templateId = templateResult.template.id;
        templateDisplayName = templateResult.template.display_name;
        versionNo = await getNextVersionNumber(templateId);
        
        // Use existing file name or new file name based on user choice
        if (useExistingName) {
          // Get the file name from the latest version
          const latestVersionQuery = `
            SELECT file_name FROM versions 
            WHERE template_id = $1 
            ORDER BY version_no DESC 
            LIMIT 1
          `;
          const latestVersionResult = await db.query(latestVersionQuery, [templateId]);
          fileNameToSave = latestVersionResult.rows[0]?.file_name || templateName;
        } else {
          fileNameToSave = templateName;
        }
        
        // Save new version
        const versionResult = await saveVersionToDb(templateId, fileNameToSave, res.url, versionNo);
        
        if (!versionResult.success) {
          return { 
            success: false, 
            error: 'Failed to save version to database', 
            file: fileName,
            username: username
          };
        }

        return { 
          success: true, 
          file: fileName,
          username: username,
          template: templateResult.template,
          version: versionResult.version,
          isUpdate: true
        };

      } else {
        // No template key - this is a new template
        const generatedKeyName = generateTemplateKeyName(templateName);
        
        // Check if template key name already exists for this user
        const keyNameCheck = await checkTemplateKeyNameExists(generatedKeyName, userId);
        
        if (keyNameCheck.exists) {
          return reply.status(409).send({
            success: false,
            error: 'Template name already exists. Please rename the new template.',
            templateExists: true,
            existingTemplate: keyNameCheck.template
          });
        }

        // Save new template (display_name = templateName)
        const templateResult = await saveNewTemplateToDb(generatedKeyName, templateName, userId);
        
        if (!templateResult.success) {
          return { 
            success: false, 
            error: 'Failed to save template to database', 
            file: fileName,
            username: username
          };
        }

        templateId = templateResult.template.id;
        versionNo = 1; // First version
        fileNameToSave = templateName;
        
        // Save first version
        const versionResult = await saveVersionToDb(templateId, fileNameToSave, res.url, versionNo);
        
        if (!versionResult.success) {
          return { 
            success: false, 
            error: 'Failed to save version to database', 
            file: fileName,
            username: username
          };
        }

        return { 
          success: true, 
          file: fileName,
          username: username,
          template: templateResult.template,
          version: versionResult.version,
          isUpdate: false
        };
      }

    } catch (error) {
      console.error('Save Error:', error);
      return { 
        success: false, 
        error: 'Failed to save template', 
        file: fileName,
        username: username
      };
    }
  });
};

export default saveRoute;


