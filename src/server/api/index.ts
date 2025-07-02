import Fastify from 'fastify';
import healthRoutes from './routes/authenticateUser';
import saveRoute from './routes/save';
import categoriesRoute from './routes/categories';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import storeUsername from './middleware/storeUsername';
import sendEmailRoute from './routes/sendEmail';

const fastify = Fastify({ logger: true });

await fastify.register(storeUsername); 

fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'fastify-api',
      description: 'API documentation',
      version: '0.1.0',
    },
  },
});

fastify.register(fastifySwaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
});

await fastify.register(cors, {
  origin: '*'
})

fastify.register(healthRoutes);
fastify.register(saveRoute);
fastify.register(categoriesRoute);
fastify.register(sendEmailRoute);

fastify.listen({ port: 4000, host: '0.0.0.0' }, err => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
