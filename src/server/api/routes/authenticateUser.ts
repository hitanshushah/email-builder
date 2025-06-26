import { FastifyPluginAsync } from 'fastify'
import db from '../../../../utils/db'
import fetch from 'node-fetch'
import { minioClient } from '../../../../utils/minioClient'
import stream from 'stream'
import { getAllTemplatesWithVersions } from '../db/saveToDb'

const healthRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get('/user', async (request) => {
    if (request.user?.username) {
      return { 
        authenticated: true, 
        username: request.user.username 
      };
    }
    
    return { 
      authenticated: false, 
      username: null 
    };
  })

  fastify.get('/user-templates', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ success: false, error: 'Not authenticated' });
    }
    try {
      const result = await getAllTemplatesWithVersions(request.user.user_id);
      return { success: true, templates: result.templates };
    } catch (err) {
      return { success: false, error: 'Failed to fetch templates' };
    }
  });

  fastify.get('/fetch-template', async (request, reply) => {
    const { link } = request.query as { link?: string };
    if (!link) {
      return reply.status(400).send({ error: 'Missing link' });
    }
    try {
      // Parse bucket and object name from the link
      // Example link: http://localhost:4801/browser/default-bucket/document-1750823153225-akadmin.json
      const match = link.match(/\/([^/]+)\/([^/]+\.json)$/);
      if (!match) {
        return reply.status(400).send({ error: 'Invalid link format' });
      }
      const bucket = match[1];
      const objectName = match[2];
      console.log('Fetching from MinIO bucket:', bucket, 'object:', objectName);
      const dataStream = await minioClient.getObject(bucket, objectName);
      const chunks: Buffer[] = [];
      for await (const chunk of dataStream as stream.Readable) {
        chunks.push(Buffer.from(chunk));
      }
      const jsonStr = Buffer.concat(chunks).toString('utf-8');
      const json = JSON.parse(jsonStr);
      return json;
    } catch (err) {
      console.error('MinIO SDK fetch error:', err);
      return reply.status(500).send({ error: 'Failed to fetch template' });
    }
  });
}

export default healthRoute
