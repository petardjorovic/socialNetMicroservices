import redisClient from "../config/redis.js";
import logger from "./logger.js";

const invalidateSearchPostCache = async (input?: string) => {
  if (input) {
    await redisClient.del(`search-post:${input}`);
    logger.info(`Invalidated cache for input: ${input}`);
  }

  let cursor = "0";
  let batch: string[] = [];

  do {
    const [nextCursor, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      "search-post:*",
      "COUNT",
      100,
    );

    cursor = nextCursor;

    for (const key of keys) {
      batch.push(key);

      if (batch.length >= 1000) {
        await redisClient.del(batch);
        batch.length = 0;
      }
    }
  } while (cursor !== "0");

  if (batch.length > 0) {
    await redisClient.del(batch);
  }
};

export default invalidateSearchPostCache;
