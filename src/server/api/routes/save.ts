import { FastifyPluginAsync } from 'fastify';
import { saveJsonToMinio } from '../minio/saveJsonToMinio';
import { saveDocumentToDb } from '../db/saveToDb';

const saveRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/save', async (request, reply) => {
    if (!request.user?.username) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const document = request.body;
    const username = request.user.username;

    const bucket = 'default-bucket';
    const fileName = `document-${Date.now()}-${username}.json`;
    const res = await saveJsonToMinio(bucket, fileName, document);
    if (res) {
        try {
          const savedRecord = await saveDocumentToDb(fileName, res.etag, res.url);
          if (savedRecord.success) {
              return { 
                success: true, 
                file: fileName,
                username: username
              };
          }
        } catch (dbError) {
          console.error('DB Save Error:', dbError);
          return { 
            success: false, 
            error: 'Saved to Minio but failed DB insert', 
            file: fileName,
            username: username
          };
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to save to Minio', 
          file: fileName,
          username: username
        };
      }
  });
};

export default saveRoute;


