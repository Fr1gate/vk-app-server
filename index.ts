import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import routesHandler from "./src/routes/index.js";
import cors from "@fastify/cors";

const fastify: FastifyInstance = Fastify({
  logger: true,
});

// Register CORS plugin
fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // In production, check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-VK-Params",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400, // 24 hours
});

// Register routes
fastify.register(routesHandler);

fastify.listen({ port: 3000 }, function (err: Error | null, address: string) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is running at ${address}`);
});
