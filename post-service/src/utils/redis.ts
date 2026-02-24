import { Redis } from "ioredis";
import { getEnv } from "./env.js";
import logger from "./logger.js";

const REDIS_URL = getEnv("REDIS_URL");

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (er) => {
  logger.error("Redis connection error", er);
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

export default redisClient;
