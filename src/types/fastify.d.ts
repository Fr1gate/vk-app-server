import { PrismaClient } from "../../generated/prisma/index.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticateToken: (request: any, reply: any) => Promise<void>;
    optionalAuth: (request: any, reply: any) => Promise<void>;
  }
}
