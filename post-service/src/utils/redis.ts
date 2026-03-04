import { Redis } from "ioredis";
import logger from "./logger.js";
import { REDIS_URL } from "./env.js";

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (er) => {
  logger.error("Redis connection error", er);
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

export default redisClient;
