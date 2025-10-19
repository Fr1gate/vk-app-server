import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { PrismaClient } from "../../../generated/prisma/index.js";
import { AuthenticatedRequest } from "../../middleware/auth.js";

export default async function userRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Initialize Prisma client
  const prisma = new PrismaClient();
  fastify.decorate("db", prisma);

  // Get user's home bases (protected route)
  fastify.get("/user/home-bases", {
    preHandler: [fastify.authenticateToken],
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const homeBases = await fastify.db.homeBase.findMany({
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

  // Create a new home base (protected route)
  fastify.post("/user/home-bases", {
    preHandler: [fastify.authenticateToken],
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const homeBase = await fastify.db.homeBase.create({
          data: {
            user_id: request.user!.userId,
          },
        });

        return reply.status(201).send({
          message: "Home base created successfully",
          homeBase: {
            id: homeBase.id,
            userId: homeBase.user_id,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Failed to create home base",
          message: "Internal server error",
        });
      }
    },
  });

  // Get user profile (protected route)
  fastify.get("/user/profile", {
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
            home_base: {
              select: {
                id: true,
                building: {
                  select: {
                    id: true,
                    type: true,
                    slot_number: true,
                    level: true,
                    is_upgraded: true,
                    will_upgrade_at: true,
                  },
                },
              },
            },
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
            homeBases: user.home_base.map((base) => ({
              id: base.id,
              buildings: base.building,
            })),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Failed to fetch user profile",
          message: "Internal server error",
        });
      }
    },
  });
}
