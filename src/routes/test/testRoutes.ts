import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from "fastify";

export default async function testRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Simple ping endpoint
  fastify.get("/ping", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send("pong");
    },
  });
}
