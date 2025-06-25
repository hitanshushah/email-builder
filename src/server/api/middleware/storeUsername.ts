// src/server/api/middleware/storeUsername.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import db from '../../../../utils/db';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      username: string;
      user_id?: string;
    };
  }
}

const storeUsername: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const username = request.headers['x-authentik-username'] as string | undefined;

    if (username) {
      let user_id = undefined;
      try {
        let result = await db.query('SELECT id FROM users WHERE name = $1', [username]);
        if (result.rows.length === 0) {
          // User does not exist, insert
          await db.query('INSERT INTO users (name, email) VALUES ($1, $2)', [username, null]);
          result = await db.query('SELECT id FROM users WHERE name = $1', [username]);
        }
        if (result.rows.length > 0) {
          user_id = Number(result.rows[0].id);
        }
      } catch (err) {
        console.error('Error fetching/inserting user_id:', err);
      }
      request.user = { username, user_id };
    }
  });
};

export default fp(storeUsername);
