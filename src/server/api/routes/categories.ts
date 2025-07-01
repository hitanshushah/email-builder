import { FastifyPluginAsync } from 'fastify';
import { 
  getAllCategories, 
  getTemplatesByCategory, 
  getTemplatesNotInCategory, 
  addTemplateToCategory 
} from '../db/saveToDb';

const categoriesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/categories', async (request, reply) => {
    try {
      const result = await getAllCategories();
      if (result.success) {
        return reply.status(200).send({ success: true, categories: result.categories });
      } else {
        return reply.status(500).send({ success: false, error: 'Failed to fetch categories' });
      }
    } catch (error) {
      console.error('Fetch Categories Error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch categories' });
    }
  });

  fastify.get('/categories/:categoryId/templates', async (request, reply) => {
    const { categoryId } = request.params as { categoryId: string };
    
    try {
      const result = await getTemplatesByCategory(parseInt(categoryId));
      if (result.success) {
        return reply.status(200).send({ success: true, templates: result.templates });
      } else {
        return reply.status(500).send({ success: false, error: 'Failed to fetch templates' });
      }
    } catch (error) {
      console.error('Fetch Templates By Category Error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch templates' });
    }
  });

  fastify.get('/categories/:categoryId/available-templates', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { categoryId } = request.params as { categoryId: string };
    const userId = request.user.user_id;
    
    try {
      const result = await getTemplatesNotInCategory(parseInt(categoryId), userId);
      if (result.success) {
        return reply.status(200).send({ success: true, templates: result.templates });
      } else {
        return reply.status(500).send({ success: false, error: 'Failed to fetch available templates' });
      }
    } catch (error) {
      console.error('Fetch Available Templates Error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch available templates' });
    }
  });

  fastify.post('/categories/:categoryId/templates', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { categoryId } = request.params as { categoryId: string };
    const { templateId } = request.body as { templateId: number };
    
    if (!templateId) {
      return reply.status(400).send({
        success: false,
        error: 'Template ID is required'
      });
    }

    try {
      const result = await addTemplateToCategory(templateId, parseInt(categoryId));
      if (result.success) {
        return reply.status(200).send({ 
          success: true, 
          message: 'Template added to category successfully!',
          templateCategory: result.templateCategory 
        });
      } else {
        return reply.status(500).send({ success: false, error: 'Failed to add template to category' });
      }
    } catch (error) {
      console.error('Add Template To Category Error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to add template to category' });
    }
  });
};

export default categoriesRoute; 