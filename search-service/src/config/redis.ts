import { Redis } from "ioredis";
import { REDIS_URL } from "../utils/env.js";
import logger from "../utils/logger.js";

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (er) => {
  logger.error("Redis connection error", er);
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

export default redisClient;
