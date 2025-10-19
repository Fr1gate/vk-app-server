export interface JWTPayload {
    userId: number;
    vkId: string;
    type: "access" | "refresh";
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate a random refresh token
 */
export declare function generateRefreshToken(): string;
/**
 * Generate access token
 */
export declare function generateAccessToken(payload: Omit<JWTPayload, "type">): string;
/**
 * Generate refresh token
 */
export declare function generateRefreshTokenJWT(payload: Omit<JWTPayload, "type">): string;
/**
 * Generate both access and refresh tokens
 */
export declare function generateTokenPair(userId: number, vkId: bigint): TokenPair;
/**
 * Verify access token
 */
export declare function verifyAccessToken(token: string): JWTPayload | null;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): JWTPayload | null;
/**
 * Extract token from Authorization header
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map