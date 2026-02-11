import { Request, Response } from "express";
import { searchQueryTerm } from "../utils/validationSchemas.js";
import logger from "../utils/logger.js";
import SearchPostModel from "../models/search-post.model.js";
import redisClient from "../config/redis.js";

export const getSearchedPosts = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Search-Post endpoint hit...");

  try {
    //* Validate request
    const result = searchQueryTerm.safeParse(req.query);
    if (!result.success) {
      logger.warn("Search-Post validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { search } = result.data;

    if (!search) {
      return res.status(200).json({ success: true, results: [] });
    }

    //* Query redis cache
    const normalizedSearch = search.toLowerCase();
    const cacheKey = `search-post:${normalizedSearch}`;

    let cachedSearchPost: string | null = null;
    try {
      cachedSearchPost = await redisClient.get(cacheKey);
    } catch (error) {
      logger.error("Search-Post cache read failed", error);
    }

    if (cachedSearchPost) {
      logger.info("Search-Post cache hit", { cacheKey });
      try {
        const parsed = JSON.parse(cachedSearchPost);
        return res.status(200).json({ success: true, results: parsed });
      } catch (parseError) {
        logger.error(
          "Search-Post cache parse failed, falling through to DB",
          parseError,
        );
      }
    }

    logger.info("Search-Post cache miss", { cacheKey });
    const foundPosts = await SearchPostModel.find(
      { $text: { $search: normalizedSearch } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

    //* Setting cache
    redisClient
      .setex(cacheKey, 180, JSON.stringify(foundPosts))
      .catch((err) => logger.error("Search-Post cache write failed", err));

    return res.status(200).json({ success: true, results: foundPosts });
  } catch (error) {
    logger.error("Search-Post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
