import Fastify from 'fastify';
import cron from 'node-cron';
import healthRoutes from './routes/authenticateUser';
import saveRoute from './routes/save';
import categoriesRoute from './routes/categories';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import storeUsername from './middleware/storeUsername';
import sendEmailRoute from './routes/sendEmail';
import { deleteDemoUserData, deleteDemoUserBucket } from '../../jobs/deleteDemoUserData';

const fastify = Fastify({ logger: true });

const cron_schedule = process.env.CRON_SCHEDULE ?? '*/15 * * * *';
const everyday_cron = process.env.EVERY_DAY_CRON ?? '0 0 * * *';

cron.schedule(cron_schedule, async () => {
  try {
    console.log('[CRON] Starting demo user cleanup...');
    await deleteDemoUserData();
  } catch (err) {
    console.error('[CRON] Error running cleanup:', err);
  }
});

cron.schedule(cron_schedule, async () => {
  try {
    console.log('[CRON] Starting demo user Minio bucket cleanup...');
    await deleteDemoUserBucket();
  } catch (err) {
    console.error('[CRON] Error running Minio bucket cleanup:', err);
  }
});

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
