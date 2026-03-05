import "dotenv/config";
import mongoose from "mongoose";
import { MONGO_URI, PORT } from "./utils/env.js";
import logger from "./utils/logger.js";
import redisClient from "./config/redis.js";
import rabbitMQService from "./config/RabbitMQService.js";
import { registerConsumers } from "./events/subscribers.js";
import { app } from "./app.js";

let server: ReturnType<typeof app.listen> | undefined;

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");

    await rabbitMQService.connect();
    await registerConsumers();

    server = app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start Media service (DB or RabbitMQ issue)", error);
    process.exit(1);
  }
};

// Start server after all middleware is configured
void start();

const gracefulShutdown = async (signal: string, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await mongoose.connection.close();
    await redisClient.quit();
    await rabbitMQService.close();
  } catch (error) {
    logger.error("Shutdown error", error);
    exitCode = 1;
  }

  if (server) {
    server.close(() => process.exit(exitCode));
  } else {
    process.exit(exitCode);
  }
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  void gracefulShutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err}`);
  void gracefulShutdown("uncaughtException", 1);
});
