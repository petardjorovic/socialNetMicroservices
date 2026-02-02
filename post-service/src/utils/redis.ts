import { Redis } from "ioredis";
import { REDIS_URL } from "./env.js";
import logger from "./logger.js";

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (er) => {
  logger.error("Redis connection error", er);
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

export default redisClient;
