import { FastifyInstance, FastifyPluginOptions } from "fastify";
import userRoutes from "./user/userRoutes.js";
import authRoutes from "./auth/auth.js";
import testRoutes from "./test/testRoutes.js";

export default async function routesHandler(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  await fastify.register(testRoutes, { prefix: "/test" });
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(userRoutes, { prefix: "/api" });
}
