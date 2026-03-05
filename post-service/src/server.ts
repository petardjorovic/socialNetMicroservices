import "dotenv/config";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import redisClient from "./utils/redis.js";
import { MONGO_URI, PORT } from "./utils/env.js";
import rabbitMQService from "./config/RabbitMQService.js";
import { app } from "./app.js";
// import "./utils/redis.js";

let server: ReturnType<typeof app.listen> | undefined;

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");
    await rabbitMQService.connect();

    server = app.listen(PORT, () => {
      logger.info(`Post service is running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start Post service (DB or RabbitMQ issue)", err);
    process.exit(1);
  }
};

void start();

const gracefulShutdown = async (signal: string, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await redisClient.quit();
    await mongoose.connection.close();
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
