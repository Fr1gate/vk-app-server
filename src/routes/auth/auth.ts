import { FastifyInstance, FastifyPluginOptions, FastifyReply } from "fastify";
import { prisma } from "../../services/prisma.js";
import {
  VKAuthenticatedRequest,
  verifyVKParams,
} from "../../middleware/vkAuth.js";

interface LoginRequestBody {
  name: string;
}

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  ////////////////////////////////////////////////////
  // POST /auth/login - логин пользователя по VK ID //
  ////////////////////////////////////////////////////
  fastify.post<{ Body: LoginRequestBody }>("/login", {
    preHandler: [verifyVKParams],
    schema: {},
    handler: async (request: VKAuthenticatedRequest, reply: FastifyReply) => {
      try {
        const vkParams = request.vkParams!;
        const vkUserId = vkParams.vk_user_id;

        // Ищем пользователя в базе данных
        const user = await prisma.user.findUnique({
          where: {
            vk_id: String(vkUserId),
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
            message:
              "User with this VK ID does not exist. Please register first.",
          });
        }

        return reply.send({
          success: true,
          message: "Login successful",
          user,
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

  ////////////////////////////////////////////////////
  // POST /auth/register - регистрация пользователя //
  ////////////////////////////////////////////////////
  fastify.post<{ Body: LoginRequestBody }>("/register", {
    preHandler: [verifyVKParams],
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
    },
    handler: async (request: VKAuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { name } = request.body as LoginRequestBody;
        const vkParams = request.vkParams!;
        const vkUserId = vkParams.vk_user_id;

        // Проверяем, не существует ли уже пользователь
        const existingUser = await prisma.user.findUnique({
          where: {
            vk_id: String(vkUserId),
          },
        });

        if (existingUser) {
          return reply.status(409).send({
            error: "User already exists",
            message: "User with this VK ID already exists",
          });
        }

        // Создаем пользователя
        const user = await prisma.user.create({
          data: {
            vk_id: String(vkUserId),
            name,
          },
        });

        return reply.status(201).send({
          success: true,
          message: "User registered successfully",
          user: {
            id: user.id,
            vkId: user.vk_id,
            name: user.name,
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
}
