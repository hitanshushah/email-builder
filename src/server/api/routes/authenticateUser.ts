import { FastifyPluginAsync } from 'fastify'
import db from '../../../../utils/db'
import fetch from 'node-fetch'
import { minioClient } from '../../../../utils/minioClient'
import stream from 'stream'
import { getAllTemplatesWithVersions } from '../db/saveToDb'

const healthRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get('/user', async (request) => {
    if (request.user?.username && request.user?.user_id) {
      // Fetch show_tour from the database
      let showTour = true;
      try {
        const result = await db.query('SELECT show_tour FROM users WHERE id = $1', [request.user.user_id]);
        if (result.rows.length > 0 && result.rows[0].show_tour !== undefined) {
          showTour = result.rows[0].show_tour;
        }
      } catch (err) {
        // fallback: show tour if error
        showTour = true;
      }
      return {
        authenticated: true,
        username: request.user.username,
        show_tour: showTour
      };
    }
    
    return {
      authenticated: false,
      username: null,
      show_tour: true
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
      const match = link.match(/\/([^/]+)\/([^/]+\.json)$/);
      if (!match) {
        return reply.status(400).send({ error: 'Invalid link format' });
      }
      const bucket = match[1];
      const objectName = match[2];
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

  fastify.post('/user/tour', async (request, reply) => {
    if (!request.user?.user_id) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }
    const { show_tour } = request.body as { show_tour?: boolean };
    const showTourValue = typeof show_tour === 'boolean' ? show_tour : false;
    try {
      await db.query('UPDATE users SET show_tour = $1, updated_at = NOW() WHERE id = $2', [showTourValue, request.user.user_id]);
      return reply.status(200).send({ success: true });
    } catch (err) {
      return reply.status(500).send({ success: false, error: 'Failed to update show_tour' });
    }
  });
}

export default healthRoute
