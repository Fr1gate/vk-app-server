export default async function testRoutes(fastify, options) {
    // Simple ping endpoint
    fastify.get("/ping", {
        handler: async (request, reply) => {
            return reply.send("pong");
        },
    });
}
//# sourceMappingURL=testRoutes.js.map