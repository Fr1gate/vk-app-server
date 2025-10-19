import jwt from "jsonwebtoken";
import crypto from "crypto";
// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ||
    "your-super-secret-refresh-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
/**
 * Generate a random refresh token
 */
export function generateRefreshToken() {
    return crypto.randomBytes(32).toString("hex");
}
/**
 * Generate access token
 */
export function generateAccessToken(payload) {
    return jwt.sign({ ...payload, vkId: payload.vkId.toString(), type: "access" }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
/**
 * Generate refresh token
 */
export function generateRefreshTokenJWT(payload) {
    return jwt.sign({ ...payload, vkId: payload.vkId.toString(), type: "refresh" }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}
/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId, vkId) {
    const payload = { userId, vkId: vkId.toString() };
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshTokenJWT(payload),
    };
}
/**
 * Verify access token
 */
export function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== "access") {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
}
/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        if (decoded.type !== "refresh") {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
}
/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7);
}
//# sourceMappingURL=jwt.js.map