import { FastifyRequest, FastifyReply } from "fastify";
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
export declare function authenticateToken(request: AuthenticatedRequest, reply: FastifyReply): Promise<void>;
/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't return error if no token
 */
export declare function optionalAuth(request: AuthenticatedRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=auth.d.ts.map