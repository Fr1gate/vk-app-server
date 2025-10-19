import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { PrismaClient } from "../../../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateRefreshToken,
} from "../../utils/jwt.js";
import { AuthenticatedRequest } from "../../middleware/auth.js";

interface RegisterRequestBody {
  vkId: string;
  name: string;
  email?: string;
  password?: string;
}

interface LoginRequestBody {
  vkId?: string;
  email?: string;
  password: string;
}

interface RefreshTokenRequestBody {
  refreshToken: string;
}

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Initialize Prisma client
  const prisma = new PrismaClient();
  fastify.decorate("db", prisma);

  // Register new user
  fastify.post<{ Body: RegisterRequestBody }>("/register", {
    schema: {
      body: {
        type: "object",
        required: ["vkId", "name"],
        properties: {
          vkId: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { vkId, name, email, password } = request.body;
        const vkIdBigInt = BigInt(vkId);

        // Check if user already exists
        const existingUser = await fastify.db.user.findFirst({
          where: {
            OR: [{ vk_id: vkIdBigInt }, ...(email ? [{ email }] : [])],
          },
        });

        if (existingUser) {
          return reply.status(409).send({
            error: "User already exists",
            message: "User with this VK ID or email already exists",
          });
        }

        // Hash password if provided
        const hashedPassword = password
          ? await bcrypt.hash(password, 12)
          : null;

        // Create user
        const user = await fastify.db.user.create({
          data: {
            vk_id: vkIdBigInt,
            name,
            email: email || null,
            password: hashedPassword,
          },
        });

        // Generate tokens
        const tokens = generateTokenPair(user.id, user.vk_id);

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
          message: "User registered successfully",
          user: {
            id: user.id,
            vkId: user.vk_id.toString(),
            name: user.name,
            email: user.email,
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: refreshTokenData,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Registration failed",
          message: "Internal server error",
        });
      }
    },
  });

  // Login user
  fastify.post<{ Body: LoginRequestBody }>("/login", {
    schema: {
      body: {
        type: "object",
        required: ["password"],
        properties: {
          vkId: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: LoginRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { vkId, email, password } = request.body;

        if (!vkId && !email) {
          return reply.status(400).send({
            error: "Invalid credentials",
            message: "Either VK ID or email is required",
          });
        }

        // Find user
        const user = await fastify.db.user.findFirst({
          where: {
            OR: [
              ...(vkId ? [{ vk_id: BigInt(vkId) }] : []),
              ...(email ? [{ email }] : []),
            ],
          },
        });

        if (!user) {
          return reply.status(401).send({
            error: "Invalid credentials",
            message: "User not found",
          });
        }

        // Verify password
        if (user.password && !(await bcrypt.compare(password, user.password))) {
          return reply.status(401).send({
            error: "Invalid credentials",
            message: "Invalid password",
          });
        }

        // Generate tokens
        const tokens = generateTokenPair(user.id, user.vk_id);

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
          message: "Login successful",
          user: {
            id: user.id,
            vkId: user.vk_id.toString(),
            name: user.name,
            email: user.email,
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: refreshTokenData,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Login failed",
          message: "Internal server error",
        });
      }
    },
  });

  // Refresh access token
  fastify.post<{ Body: RefreshTokenRequestBody }>("/refresh", {
    schema: {
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: RefreshTokenRequestBody }>,
      reply: FastifyReply
    ) => {
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
        const newAccessToken = generateTokenPair(
          payload.userId,
          BigInt(payload.vkId)
        ).accessToken;

        return reply.send({
          message: "Token refreshed successfully",
          accessToken: newAccessToken,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Token refresh failed",
          message: "Internal server error",
        });
      }
    },
  });

  // Logout (revoke refresh token)
  fastify.post<{ Body: RefreshTokenRequestBody }>("/logout", {
    schema: {
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: RefreshTokenRequestBody }>,
      reply: FastifyReply
    ) => {
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
      } catch (error) {
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
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const user = await fastify.db.user.findUnique({
          where: { id: request.user!.userId },
          select: {
            id: true,
            vk_id: true,
            name: true,
            email: true,
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
            email: user.email,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Profile fetch failed",
          message: "Internal server error",
        });
      }
    },
  });
}
