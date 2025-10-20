import { FastifyRequest, FastifyReply } from "fastify";
import { verifyLaunchParams } from "../utils/vkSign.js";

export interface VKAuthenticatedRequest extends FastifyRequest {
  vkParams?: Record<string, any>;
  user?: {
    userId: number;
    vkId: string;
  };
}

/**
 * VK Parameters middleware (without user lookup)
 * Only verifies VK parameters and adds them to request
 */
export async function verifyVKParams(
  request: VKAuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const vkParamsHeader = request.headers["x-vk-params"] as string;

    if (!vkParamsHeader) {
      return reply.status(401).send({
        error: "VK parameters required",
        message:
          "X-VK-Params header with base64 encoded VK parameters is required",
      });
    }

    // Decode base64 parameters
    let vkParams: Record<string, any>;
    try {
      const decodedParams = Buffer.from(vkParamsHeader, "base64").toString(
        "utf-8"
      );
      vkParams = JSON.parse(decodedParams);
    } catch (error) {
      return reply.status(400).send({
        error: "Invalid VK parameters",
        message: "Failed to decode or parse VK parameters from header",
      });
    }

    // Get VK app secret from environment
    const vkAppSecret = process.env.VK_CLIENT_SECRET;
    if (!vkAppSecret) {
      return reply.status(500).send({
        error: "VK app secret not found",
        message: "VK app secret is not set in environment variables",
      });
    }

    // Verify VK signature
    const isValidSignature = verifyLaunchParams(vkParams, vkAppSecret);
    if (!isValidSignature) {
      return reply.status(401).send({
        error: "Invalid VK signature",
        message: "VK parameters signature verification failed",
      });
    }

    // Extract user ID from VK parameters
    const vkUserId = vkParams.vk_user_id;
    if (!vkUserId) {
      return reply.status(400).send({
        error: "Missing VK user ID",
        message: "vk_user_id parameter is required in VK parameters",
      });
    }

    // Add VK params to request
    request.vkParams = vkParams;
  } catch (error) {
    return reply.status(500).send({
      error: "VK parameters verification error",
      message: "Internal server error during VK parameters verification",
    });
  }
}
