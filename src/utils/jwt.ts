import jwt from "jsonwebtoken";
import crypto from "crypto";

// JWT configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-super-secret-refresh-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface JWTPayload {
  userId: number;
  vkId: string; // Store as string to avoid BigInt serialization issues
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate a random refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    { ...payload, vkId: payload.vkId.toString(), type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshTokenJWT(
  payload: Omit<JWTPayload, "type">
): string {
  return jwt.sign(
    { ...payload, vkId: payload.vkId.toString(), type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: number, vkId: bigint): TokenPair {
  const payload = { userId, vkId: vkId.toString() };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshTokenJWT(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== "access") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
