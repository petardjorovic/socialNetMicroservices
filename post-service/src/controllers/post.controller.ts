import { NextFunction, Response, Request } from "express";
import logger from "../utils/logger.js";
import { createPostSchema } from "../utils/validationSchemas.js";
import PostModel from "../models/post.model.js";

//* create post
export const createPost = async (req: Request, res: Response) => {
  logger.info("Create post endpoint hit...");
  try {
    const result = createPostSchema.safeParse(req.body);

    if (!result.success) {
      logger.warn("Validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { content, mediaIds } = result.data;

    const newlyCreatedPost = new PostModel({
      user: req.user?.userId, // znam da req.user postoji jer je prosao auth middleware
      content,
      mediaIds,
    });
    await newlyCreatedPost.save();
    logger.info("Post created successfully", newlyCreatedPost);

    return res
      .status(201)
      .json({ success: true, message: "Post create successfully" });
  } catch (error) {
    logger.error("Create post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* get posts
export const getPosts = async (req: Request, res: Response) => {
  logger.info("Get posts endpoint hit...");
  try {
  } catch (error) {
    logger.error("Get post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* get post
export const getPost = async (req: Request, res: Response) => {
  logger.info("Get post endpoint hit...");
  try {
  } catch (error) {
    logger.error("Get post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* update post
export const updatePost = async (req: Request, res: Response) => {
  logger.info("Update post endpoint hit...");
  try {
  } catch (error) {
    logger.error("Update post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* delete post
export const deletePost = async (req: Request, res: Response) => {
  logger.info("Delete post endpoint hit...");
  try {
  } catch (error) {
    logger.error("Delete post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
