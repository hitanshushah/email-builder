// src/server/api/middleware/storeUsername.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import db from '../../../../utils/db';
import { autoCreateTemplatesForUser } from '../db/autoCreateTemplates';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      username: string;
      user_id?: number;
    };
  }
}

const storeUsername: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const username = request.headers['x-authentik-username'] as string | undefined;
    const email = request.headers['x-authentik-email'] as string | undefined;

    if (username) {
      let user_id = undefined;
      let isNewUser = false;
      try {
        let result = await db.query('SELECT id FROM users WHERE name = $1', [username]);
        if (result.rows.length === 0) {
          await db.query('INSERT INTO users (name, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())', [username, email || null]);
          result = await db.query('SELECT id FROM users WHERE name = $1', [username]);
          isNewUser = true;
        } else if (email) {
          await db.query('UPDATE users SET email = $1, updated_at = NOW() WHERE name = $2', [email, username]);
        }
        if (result.rows.length > 0) {
          user_id = Number(result.rows[0].id);
        }
      } catch (err) {
        console.error('Error fetching/inserting user_id:', err);
      }
      request.user = { username, user_id };
      
      if (isNewUser && user_id) {
        try {
          await autoCreateTemplatesForUser(user_id, username);
        } catch (error) {
          // Silent fail - don't block user authentication
        }
      }
    } else {
      // No username header, assign demo user
      try {
        const result = await db.query('SELECT id FROM users WHERE name = $1', ['demo-user']);
        let demoUserId = null;
        if (result.rows.length > 0) {
          demoUserId = Number(result.rows[0].id);
          request.user = { username: 'demo-user', user_id: demoUserId };
        } else {
          // Fallback: create demo user if not present
          await db.query('INSERT INTO users (name, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())', ['demo-user', 'demo@email.com']);
          const newResult = await db.query('SELECT id FROM users WHERE name = $1', ['demo-user']);
          if (newResult.rows.length > 0) {
            demoUserId = Number(newResult.rows[0].id);
            request.user = { username: 'demo-user', user_id: demoUserId };
          }
        }
        // Check if demo user has any templates, if not, auto-create them
        if (demoUserId) {
          const templatesResult = await db.query('SELECT id FROM templates WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1', [demoUserId]);
          if (templatesResult.rows.length === 0) {
            try {
              await autoCreateTemplatesForUser(demoUserId, 'demo-user');
            } catch (error) {
              // Silent fail - don't block demo user
            }
          }
        }
      } catch (err) {
        console.error('Error fetching/creating demo user:', err);
      }
    }
  });
};

export default fp(storeUsername);
