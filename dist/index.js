import Fastify from "fastify";
import routesHandler from "./src/routes/index.js";
const fastify = Fastify({
    logger: true,
});
// Register routes
fastify.log.info("Registering main routes handler...");
fastify.register(routesHandler);
fastify.log.info("Main routes handler registered");
fastify.listen({ port: 3000 }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`Server is running at ${address}`);
});
//# sourceMappingURL=index.js.map