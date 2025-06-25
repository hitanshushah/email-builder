import { FastifyPluginAsync } from 'fastify'

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return { ok: true }
  })

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
}

export default healthRoute
