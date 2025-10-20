import { FastifyInstance, FastifyPluginOptions, FastifyReply } from "fastify";
import { prisma } from "../../services/prisma.js";
import {
  VKAuthenticatedRequest,
  verifyVKParams,
} from "../../middleware/vkAuth.js";

export default async function userRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Get user's home bases (protected route)
  fastify.get("/user/home-base", {
    preHandler: [verifyVKParams],
    handler: async (request: VKAuthenticatedRequest, reply: FastifyReply) => {
      try {
        const homeBases = await prisma.homeBase.findMany({
          where: { user_id: request.user!.userId },
          include: {
            building: true,
          },
        });

        return reply.send({
          homeBases: homeBases.map((base) => ({
            id: base.id,
            buildings: base.building.map((building) => ({
              id: building.id,
              type: building.type,
              slotNumber: building.slot_number,
              level: building.level,
              isUpgraded: building.is_upgraded,
              willUpgradeAt: building.will_upgrade_at,
            })),
          })),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Failed to fetch home bases",
          message: "Internal server error",
        });
      }
    },
  });
}
