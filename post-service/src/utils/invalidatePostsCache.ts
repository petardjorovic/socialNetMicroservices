import redisClient from "./redis.js";

const invalidatePostsCache = async (input?: string) => {
  if (input) {
    await redisClient.del(`post:${input}`);
  }
  // const keys = await redisClient.keys("posts:*");
  // if (keys.length > 0) {
  //   await redisClient.del(keys);
  // }
  let cursor = "0";
  const batch: string[] = [];

  do {
    const [nextCursor, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      "posts:*",
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

export default invalidatePostsCache;
