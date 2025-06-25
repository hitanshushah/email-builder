// src/server/api/middleware/storeUsername.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      username: string;
    };
  }
}

const storeUsername: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const username = request.headers['x-authentik-username'] as string | undefined;

    if (username) {
      request.user = { username };
    } 
  });
};

export default fp(storeUsername);
