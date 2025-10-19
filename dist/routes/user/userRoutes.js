export default async function userRoutes(fastify, options) {
    fastify.post("/user/check-id", {
        handler: async (request, reply) => {
            const { username, password } = request.body;
            const user = await fastify.db.user.create({
                username,
                password
            });
            return user;
        }
    });
}
//# sourceMappingURL=userRoutes.js.map