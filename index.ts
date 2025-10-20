import Fastify, { FastifyInstance } from "fastify";
import routesHandler from "./src/routes/index.js";

const fastify: FastifyInstance = Fastify({
  logger: true,
});

// Register routes
fastify.register(routesHandler);

fastify.listen({ port: 3000 }, function (err: Error | null, address: string) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is running at ${address}`);
});
