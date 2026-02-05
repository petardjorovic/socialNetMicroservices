import { Redis } from "ioredis";
import { REDIS_URL } from "./env.js";
import logger from "./logger.js";

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (err) => {
  logger.error("Redis client error", err);
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

export default redisClient;
