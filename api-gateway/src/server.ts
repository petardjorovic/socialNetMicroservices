import "dotenv/config";
import { app } from "./app.js";
import {
  IDENTITY_SERVICE_URL,
  MEDIA_SERVICE_URL,
  PORT,
  POST_SERVICE_URL,
  REDIS_URL,
  SEARCH_SERVICE_URL,
} from "./utils/env.js";
import logger from "./utils/logger.js";
import redisClient from "./utils/redis.js";

let server: ReturnType<typeof app.listen> | undefined;

const start = () => {
  server = app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on url ${IDENTITY_SERVICE_URL}`);
    logger.info(`Post service is running on url ${POST_SERVICE_URL}`);
    logger.info(`Media service is running on url ${MEDIA_SERVICE_URL}`);
    logger.info(`Search service is running on url ${SEARCH_SERVICE_URL}`);
    logger.info(`Redis Url ${REDIS_URL} `);
  });
};

void start();

const gracefulShutdown = async (signal: string, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await redisClient.quit();
    // await mongoose.connection.close();
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
