import { FastifyPluginAsync } from 'fastify';
import { saveJsonToMinio, deleteFileFromMinio, extractFileNameFromLink, fetchJsonFromMinio, compareJsonObjects } from '../minio/saveJsonToMinio';
import { 
  checkTemplateKeyNameExists, 
  saveNewTemplateToDb, 
  getTemplateByKey,
  getNextVersionNumber,
  saveVersionToDb,
  generateTemplateKeyName,
  getVersionById,
  updateVersionLink,
  checkCategoryKeyExists,
  saveNewCategoryToDb,
  renameVersionFileName,
  softDeleteVersion
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

    const { 
      document, 
      templateName, 
      templateKey, 
      useExistingName, 
      selectedVersionId,
      saveMode 
    } = request.body as { 
      document: any, 
      templateName?: string, 
      templateKey?: string,
      useExistingName?: boolean,
      selectedVersionId?: number,
      saveMode?: 'overwrite' | 'new'
    };
    const username = request.user.username;
    const userId = request.user.user_id;

    if (!templateName && saveMode !== 'overwrite') {
      return reply.status(400).send({
        success: false,
        error: 'File name is required'
      });
    }

    const bucket = 'default-bucket';
    const fileName = `document-${Date.now()}-${username}.json`;
    
    try {
      if (selectedVersionId) {
        const versionResult = await getVersionById(selectedVersionId);
        if (!versionResult.success || !versionResult.version) {
          return reply.status(404).send({
            success: false,
            error: 'Selected version not found'
          });
        }

        try {
          const originalJson = await fetchJsonFromMinio(versionResult.version.link);
          const hasChanges = !compareJsonObjects(originalJson, document);
          
          if (!hasChanges) {
            return reply.status(200).send({
              success: true,
              message: 'No changes detected. Template not saved.',
              noChanges: true
            });
          }
        } catch (err) {
          console.error('Error fetching original JSON:', err);
        }
      }

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
        const templateResult = await getTemplateByKey(templateKey, userId);
        
        if (!templateResult.success || !templateResult.template) {
          return reply.status(404).send({
            success: false,
            error: 'Template not found'
          });
        }

        templateId = templateResult.template.id;
        templateDisplayName = templateResult.template.display_name;
        
        if (useExistingName) {
          fileNameToSave = templateDisplayName;
        } else {
          fileNameToSave = templateName;
        }

        if (selectedVersionId && saveMode === 'overwrite') {
          const updateResult = await updateVersionLink(selectedVersionId, res.url);
          
          if (!updateResult.success) {
            return { 
              success: false, 
              error: 'Failed to update version in database', 
              file: fileName,
              username: username
            };
          }

          return { 
            success: true, 
            file: fileName,
            username: username,
            template: templateResult.template,
            version: updateResult.version,
            isUpdate: true,
            isOverwrite: true
          };
        } else {
          versionNo = await getNextVersionNumber(templateId);
          
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
            isUpdate: true,
            isOverwrite: false
          };
        }

      } else {
        const generatedKeyName = generateTemplateKeyName(templateName);
        
        const keyNameCheck = await checkTemplateKeyNameExists(generatedKeyName, userId);
        
        if (keyNameCheck.exists) {
          return reply.status(409).send({
            success: false,
            error: 'Template name already exists. Please rename the new template.',
            templateExists: true,
            existingTemplate: keyNameCheck.template
          });
        }

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
        versionNo = 1;
        fileNameToSave = templateName;
        
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

  fastify.post('/create-category', async (request, reply) => {
    if (!request.user?.username || !request.user?.user_id) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { categoryName } = request.body as { categoryName: string };
    
    if (!categoryName || !categoryName.trim()) {
      return reply.status(400).send({
        success: false,
        error: 'Category name is required'
      });
    }

    try {
      const keyName = categoryName.toLowerCase().replace(/\s+/g, '');
      
      const keyNameCheck = await checkCategoryKeyExists(keyName);
      
      if (keyNameCheck.exists) {
        return reply.status(409).send({
          success: false,
          error: 'Category name already exists. Please use a different name.',
          categoryExists: true,
          existingCategory: keyNameCheck.category
        });
      }

      const categoryResult = await saveNewCategoryToDb(keyName, categoryName.trim());
      
      if (!categoryResult.success) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to save category to database'
        });
      }

      return reply.status(200).send({
        success: true,
        category: categoryResult.category,
        message: 'Category created successfully!'
      });

    } catch (error) {
      console.error('Create Category Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create category'
      });
    }
  });

  fastify.post('/rename-version', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ success: false, error: 'Not authenticated' });
    }
    const { versionId, newFileName } = request.body as { versionId: number, newFileName: string };
    if (!versionId || !newFileName) {
      return reply.status(400).send({ success: false, error: 'Missing versionId or newFileName' });
    }
    try {
      const result = await renameVersionFileName(versionId, newFileName);
      if (result.success) {
        return { success: true, version: result.version };
      } else {
        return { success: false, error: 'Rename failed' };
      }
    } catch (err) {
      return { success: false, error: 'Rename failed' };
    }
  });

  fastify.post('/delete-version', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ success: false, error: 'Not authenticated' });
    }
    const { versionId } = request.body as { versionId: number };
    if (!versionId) {
      return reply.status(400).send({ success: false, error: 'Missing versionId' });
    }
    try {
      const result = await softDeleteVersion(versionId);
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Delete failed' };
      }
    } catch (err) {
      return { success: false, error: 'Delete failed' };
    }
  });
};

export default saveRoute;


