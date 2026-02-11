import { Response, Request } from "express";
import logger from "../utils/logger.js";
import redisClient from "../utils/redis.js";
import invalidatePostsCache from "../utils/invalidatePostsCache.js";
import PostModel from "../models/post.model.js";
import {
  createPostSchema,
  getPostsSchema,
  postIdSchema,
  updatePostSchema,
} from "../utils/validationSchemas.js";
import rabbitMQService from "../config/RabbitMQService.js";

//* CREATE POST
export const createPost = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Create post endpoint hit...");
  try {
    //* Validate request
    const result = createPostSchema.safeParse(req.body);

    if (!result.success) {
      logger.warn("Create post validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { content, mediaIds } = result.data;

    //* Query database
    const newlyCreatedPost = new PostModel({
      user: req.user!.userId, // znam da req.user postoji jer je prosao auth middleware
      content,
      mediaIds,
    });
    await newlyCreatedPost.save();

    //* Publish post.create message to RabbitMQ
    rabbitMQService
      .publish("post.created", {
        postId: newlyCreatedPost._id.toString(),
        userId: newlyCreatedPost.user.toString(),
        content: newlyCreatedPost.content,
        createdAt: newlyCreatedPost.createdAt,
      })
      .catch((err) => {
        logger.error("Failed to publish post.created event", err);
      });

    //* Invalidate cache
    invalidatePostsCache().catch((cacheError) =>
      logger.warn("Post cache invalidation failed", cacheError),
    );

    logger.info("Post created successfully", {
      postId: newlyCreatedPost._id,
      userId: newlyCreatedPost.user,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newlyCreatedPost,
    });
  } catch (error) {
    logger.error("Create post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* GET POSTS
export const getPosts = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Get posts endpoint hit...");
  try {
    //* Validate request
    const result = getPostsSchema.safeParse(req.query);
    if (!result.success) {
      logger.warn("Get posts validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { page = 1, limit = 10 } = result.data;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      100,
      Math.max(1, parseInt(String(limit), 10) || 10),
    );
    const skip = (currentPage - 1) * limitPerPage;

    //* Query redis cache
    const cacheKey = `posts:${currentPage}:${limitPerPage}`;

    let cachedPosts: string | null = null;
    try {
      cachedPosts = await redisClient.get(cacheKey);
    } catch (cacheError) {
      logger.error("Posts cache read failed", cacheError);
    }

    if (cachedPosts) {
      return res
        .status(200)
        .json({ success: true, ...JSON.parse(cachedPosts) });
    }

    //* Query database
    const [posts, totalPosts] = await Promise.all([
      PostModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitPerPage)
        .lean(),
      PostModel.countDocuments(),
    ]);

    const responseData = {
      posts,
      currentPage,
      totalPages: Math.ceil(totalPosts / limitPerPage),
      totalPosts,
      limit: limitPerPage,
    };

    //* Setting cache
    redisClient
      .setex(cacheKey, 300, JSON.stringify(responseData))
      .catch((cacheError) =>
        logger.warn("Posts cache write failed", cacheError),
      );

    logger.info("Get posts request completed", {
      resultCount: posts.length,
    });

    return res.status(200).json({ success: true, ...responseData });
  } catch (error) {
    logger.error("Get post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* GET SINGLE POST
export const getPost = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Get post endpoint hit...");
  try {
    //* Validate request
    const result = postIdSchema.safeParse(req.params);
    if (!result.success) {
      logger.warn("Validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { id: postId } = result.data;

    //* Query redis cache
    const cachedKey = `post:${postId}`;

    let cachedPost: string | null = null;
    try {
      cachedPost = await redisClient.get(cachedKey);
    } catch (cacheError) {
      logger.error("Post cache read failed", cacheError);
    }

    if (cachedPost) {
      return res
        .status(200)
        .json({ success: true, post: JSON.parse(cachedPost) });
    }

    //* Query database
    const post = await PostModel.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    //* Setting cache
    redisClient
      .setex(cachedKey, 3600, JSON.stringify(post.toObject()))
      .catch((cacheError) =>
        logger.error("Post cache write failed", cacheError),
      );

    return res.status(200).json({ success: true, post: post.toObject() });
  } catch (error) {
    logger.error("Get post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* UPDATE POST
export const updatePost = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Update post endpoint hit...");
  try {
    //* Validate request
    const bodyResult = updatePostSchema.safeParse(req.body);
    const paramsResult = postIdSchema.safeParse(req.params);
    if (!bodyResult.success || !paramsResult.success) {
      const errors = [
        ...(bodyResult.success
          ? []
          : bodyResult.error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            }))),
        ...(paramsResult.success
          ? []
          : paramsResult.error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            }))),
      ];

      logger.warn("Validation failed", errors);

      return res.status(400).json({ success: false, message: errors });
    }

    const { content, mediaIds } = bodyResult.data;
    const { id: postId } = paramsResult.data;

    const updateData: Record<string, any> = {};
    if (content !== undefined) updateData.content = content;
    if (mediaIds !== undefined) updateData.mediaIds = mediaIds;

    //* Query database
    const updatedPost = await PostModel.findOneAndUpdate(
      { _id: postId, user: req.user!.userId },
      updateData,
      { new: true },
    ).lean();

    if (!updatedPost) {
      logger.error("Post not found for updating");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    //* Publish post.updated message to RabbitMQ
    rabbitMQService
      .publish("post.updated", {
        postId: updatedPost._id.toString(),
        userId: req.user!.userId,
        content: updatedPost.content,
      })
      .catch((err) =>
        logger.error("Failed to publish post.updated event", err),
      );

    //* Invalidate cache
    invalidatePostsCache(postId).catch((cacheError) =>
      logger.warn("Post cache invalidation failed", cacheError),
    );

    logger.info(`Post updated successfully`, {
      postId,
      userId: req.user!.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Post successfully updated",
      post: updatedPost,
    });
  } catch (error) {
    logger.error("Update post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* DELETE POST
export const deletePost = async (req: Request, res: Response) => {
  //* Logging
  logger.info("Delete post endpoint hit...");
  try {
    //* Validate request
    const result = postIdSchema.safeParse(req.params);
    if (!result.success) {
      logger.warn("Delete post validation failed", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { id: postId } = result.data;

    //* Query database
    const deletedPost = await PostModel.findOneAndDelete({
      _id: postId,
      user: req.user!.userId,
    });

    if (!deletedPost) {
      logger.error("Post not found for deleting");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    //* Publish post.deleted message to RabbitMQ
    rabbitMQService
      .publish("post.deleted", {
        postId: deletedPost._id,
        userId: req.user!.userId,
        mediaIds: deletedPost.mediaIds,
      })
      .catch((err) => {
        logger.error("Failed to publish post.deleted event", err);
      });

    //* Invalidate cache (non blocking)
    invalidatePostsCache(postId).catch((cacheError) =>
      logger.warn("Post cache invalidation failed", cacheError),
    );

    logger.info(`Post deleted successfully`, {
      postId,
      userId: req.user!.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Post successfully deleted",
    });
  } catch (error) {
    logger.error("Delete post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
