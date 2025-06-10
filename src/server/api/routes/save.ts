import { FastifyPluginAsync } from 'fastify';
import { saveJsonToMinio } from '../minio/saveJsonToMinio';
import { saveDocumentToDb } from '../db/saveToDb';

const saveRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/save', async (request, reply) => {
    const document = request.body;

    const bucket = 'default-bucket';
    const fileName = `document-${Date.now()}.json`;
    const res = await saveJsonToMinio(bucket, fileName, document);
    if (res) {
        try {
          const savedRecord = await saveDocumentToDb(fileName, res.etag, res.url);
          if (savedRecord.success) {
              return { success: true, file: fileName};
          }
        } catch (dbError) {
          console.error('DB Save Error:', dbError);
          return { success: false, error: 'Saved to Minio but failed DB insert', file: fileName };
        }
      } else {
        return { success: false, error: 'Failed to save to Minio', file: fileName };
      }
  });
};

export default saveRoute;


