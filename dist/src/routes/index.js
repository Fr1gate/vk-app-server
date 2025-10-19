import userRoutes from "./user/userRoutes.js";
import authRoutes from "./auth/authRoutes.js";
import testRoutes from "./test/testRoutes.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
export default async function routesHandler(fastify, options) {
    try {
        // Register authentication middleware
        fastify.decorate("authenticateToken", authenticateToken);
        fastify.decorate("optionalAuth", optionalAuth);
        // Register routes
        fastify.log.info("Registering test routes...");
        await fastify.register(testRoutes, { prefix: "/test" });
        fastify.log.info("Registering auth routes...");
        await fastify.register(authRoutes, { prefix: "/auth" });
        fastify.log.info("Registering user routes...");
        await fastify.register(userRoutes, { prefix: "/api" });
        fastify.log.info("All routes registered successfully");
    }
    catch (error) {
        fastify.log.error("Error registering routes:", error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map