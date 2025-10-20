import { PrismaClient } from "../../../generated/prisma/index.js";
import { generateTokenPair, generateVKTokenPair, verifyRefreshToken, generateRefreshToken, } from "../../utils/jwt.js";
export default async function authRoutes(fastify, options) {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    fastify.decorate("db", prisma);
    // VK Authentication - Check if user exists
    fastify.post("/vk-auth", {
        schema: {
            body: {
                type: "object",
                required: ["vkId"],
                properties: {
                    vkId: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const { vkId } = request.body;
                const vkIdBigInt = BigInt(vkId);
                // Check if user exists in database
                const existingUser = await fastify.db.user.findUnique({
                    where: {
                        vk_id: vkIdBigInt,
                    },
                    select: {
                        id: true,
                        vk_id: true,
                        name: true,
                    },
                });
                if (existingUser) {
                    // User exists - generate tokens and return user data
                    const tokens = generateVKTokenPair(existingUser.id, existingUser.vk_id);
                    // Store refresh token in database
                    const refreshTokenData = generateRefreshToken();
                    await fastify.db.refreshToken.create({
                        data: {
                            token: refreshTokenData,
                            user_id: existingUser.id,
                            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        },
                    });
                    return reply.send({
                        success: true,
                        userExists: true,
                        message: "User authenticated successfully",
                        user: {
                            id: existingUser.id,
                            vkId: existingUser.vk_id.toString(),
                            name: existingUser.name,
                        },
                        tokens: {
                            accessToken: tokens.accessToken,
                            refreshToken: refreshTokenData,
                        },
                    });
                }
                else {
                    // User doesn't exist - notify frontend to request registration
                    return reply.send({
                        success: true,
                        userExists: false,
                        message: "User not found. Registration required.",
                        vkId: vkId,
                    });
                }
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "VK authentication failed",
                    message: "Internal server error",
                });
            }
        },
    });
    // Register new VK user
    fastify.post("/register", {
        schema: {
            body: {
                type: "object",
                required: ["vkId", "name"],
                properties: {
                    vkId: { type: "string" },
                    name: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const { vkId, name } = request.body;
                const vkIdBigInt = BigInt(vkId);
                // Check if user already exists
                const existingUser = await fastify.db.user.findUnique({
                    where: {
                        vk_id: vkIdBigInt,
                    },
                });
                if (existingUser) {
                    return reply.status(409).send({
                        error: "User already exists",
                        message: "User with this VK ID already exists",
                    });
                }
                // Create user (no password needed for VK auth)
                const user = await fastify.db.user.create({
                    data: {
                        vk_id: vkIdBigInt,
                        name,
                        password: null, // No password for VK users
                    },
                });
                // Generate tokens
                const tokens = generateVKTokenPair(user.id, user.vk_id);
                // Store refresh token in database
                const refreshTokenData = generateRefreshToken();
                await fastify.db.refreshToken.create({
                    data: {
                        token: refreshTokenData,
                        user_id: user.id,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    },
                });
                return reply.status(201).send({
                    success: true,
                    message: "User registered successfully",
                    user: {
                        id: user.id,
                        vkId: user.vk_id.toString(),
                        name: user.name,
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: refreshTokenData,
                    },
                });
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "Registration failed",
                    message: "Internal server error",
                });
            }
        },
    });
    // VK Login user (VK ID only)
    fastify.post("/login", {
        schema: {
            body: {
                type: "object",
                required: ["vkId"],
                properties: {
                    vkId: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const { vkId } = request.body;
                const vkIdBigInt = BigInt(vkId);
                // Find user by VK ID
                const user = await fastify.db.user.findUnique({
                    where: {
                        vk_id: vkIdBigInt,
                    },
                    select: {
                        id: true,
                        vk_id: true,
                        name: true,
                    },
                });
                if (!user) {
                    return reply.status(404).send({
                        error: "User not found",
                        message: "User with this VK ID does not exist. Please register first.",
                    });
                }
                // Generate tokens
                const tokens = generateVKTokenPair(user.id, user.vk_id);
                // Store refresh token in database
                const refreshTokenData = generateRefreshToken();
                await fastify.db.refreshToken.create({
                    data: {
                        token: refreshTokenData,
                        user_id: user.id,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    },
                });
                return reply.send({
                    success: true,
                    message: "Login successful",
                    user: {
                        id: user.id,
                        vkId: user.vk_id.toString(),
                        name: user.name,
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: refreshTokenData,
                    },
                });
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "Login failed",
                    message: "Internal server error",
                });
            }
        },
    });
    // Refresh access token
    fastify.post("/refresh", {
        schema: {
            body: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const { refreshToken } = request.body;
                // Verify refresh token
                const payload = verifyRefreshToken(refreshToken);
                if (!payload) {
                    return reply.status(401).send({
                        error: "Invalid refresh token",
                        message: "Refresh token is invalid or expired",
                    });
                }
                // Check if refresh token exists in database and is not revoked
                const tokenRecord = await fastify.db.refreshToken.findFirst({
                    where: {
                        token: refreshToken,
                        user_id: payload.userId,
                        is_revoked: false,
                        expires_at: {
                            gt: new Date(),
                        },
                    },
                });
                if (!tokenRecord) {
                    return reply.status(401).send({
                        error: "Invalid refresh token",
                        message: "Refresh token not found or expired",
                    });
                }
                // Generate new access token
                const newAccessToken = generateTokenPair(payload.userId, BigInt(payload.vkId)).accessToken;
                return reply.send({
                    message: "Token refreshed successfully",
                    accessToken: newAccessToken,
                });
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "Token refresh failed",
                    message: "Internal server error",
                });
            }
        },
    });
    // Logout (revoke refresh token)
    fastify.post("/logout", {
        schema: {
            body: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const { refreshToken } = request.body;
                // Revoke refresh token
                await fastify.db.refreshToken.updateMany({
                    where: {
                        token: refreshToken,
                        is_revoked: false,
                    },
                    data: {
                        is_revoked: true,
                    },
                });
                return reply.send({
                    message: "Logout successful",
                });
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "Logout failed",
                    message: "Internal server error",
                });
            }
        },
    });
    // Get current user profile (protected route)
    fastify.get("/me", {
        preHandler: [fastify.authenticateToken],
        handler: async (request, reply) => {
            try {
                const user = await fastify.db.user.findUnique({
                    where: { id: request.user.userId },
                    select: {
                        id: true,
                        vk_id: true,
                        name: true,
                    },
                });
                if (!user) {
                    return reply.status(404).send({
                        error: "User not found",
                        message: "User profile not found",
                    });
                }
                return reply.send({
                    user: {
                        id: user.id,
                        vkId: user.vk_id.toString(),
                        name: user.name,
                    },
                });
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: "Profile fetch failed",
                    message: "Internal server error",
                });
            }
        },
    });
}
//# sourceMappingURL=authRoutes.js.map