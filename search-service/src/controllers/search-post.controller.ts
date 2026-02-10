import { NextFunction, Request, Response } from "express";
import { searchQueryTerm } from "../utils/validationSchemas.js";
import logger from "../utils/logger.js";
import SearchPostModel from "../models/search-post.model.js";

export const getSearchedPosts = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Search post endpoint hit...");

  try {
    //* Validate request
    const result = searchQueryTerm.safeParse(req.query);
    if (!result.success) {
      logger.warn("Search post validation failed", result.error.message);

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

    const findedPosts = await SearchPostModel.find(
      { $text: { $search: search } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    return res.status(200).json({ success: true, results: findedPosts });
  } catch (error) {
    logger.error("Search post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
