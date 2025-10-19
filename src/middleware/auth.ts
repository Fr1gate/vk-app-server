import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractTokenFromHeader } from "../utils/jwt.js";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: number;
    vkId: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT access token and adds user info to request
 */
export async function authenticateToken(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.status(401).send({
        error: "Access token required",
        message: "Authorization header with Bearer token is required",
      });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return reply.status(401).send({
        error: "Invalid token",
        message: "Access token is invalid or expired",
      });
    }

    // Add user info to request
    request.user = {
      userId: payload.userId,
      vkId: payload.vkId,
    };
  } catch (error) {
    return reply.status(500).send({
      error: "Authentication error",
      message: "Internal server error during authentication",
    });
  }
}

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't return error if no token
 */
export async function optionalAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        request.user = {
          userId: payload.userId,
          vkId: payload.vkId,
        };
      }
    }
  } catch (error) {
    // Silently ignore errors for optional auth
  }
}
