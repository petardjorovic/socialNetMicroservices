import { Response, Request } from "express";
import logger from "../utils/logger.js";
import redisClient from "../utils/redis.js";
import PostModel from "../models/post.model.js";
import {
  createPostSchema,
  getPostsSchema,
  postIdSchema,
} from "../utils/validationSchemas.js";

const invalidatePostsCache = async (input?: string) => {
  if (input) {
    const cachedKey = `post:${input}`;
    await redisClient.del(cachedKey);
  }
  const keys = await redisClient.keys("posts:*");
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

//* CREATE POST
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

    // invalidate cached posts when there is a new post
    await invalidatePostsCache();
    logger.info("Post created successfully", {
      postId: newlyCreatedPost._id,
      userId: newlyCreatedPost.user,
    });

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

//* GET POSTS
export const getPosts = async (req: Request, res: Response) => {
  logger.info("Get posts endpoint hit...");
  try {
    const result = getPostsSchema.safeParse(req.query);
    if (!result.success) {
      logger.warn("Validation failed", result.error.message);

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

    const cacheKey = `posts:${currentPage}:${limitPerPage}`;

    const cachedPosts = await redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    const posts = await PostModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitPerPage);

    const totalPosts = await PostModel.countDocuments();

    const data = {
      posts,
      currentPage,
      totalPages: Math.ceil(totalPosts / limitPerPage),
      totalPosts,
      limit: limitPerPage,
    };

    // save your post in redis cache
    await redisClient.setex(cacheKey, 300, JSON.stringify(data));

    return res.status(200).json(data);
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
  logger.info("Get post endpoint hit...");
  try {
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

    const cachedKey = `post:${postId}`;

    const cachedPost = await redisClient.get(cachedKey);

    if (cachedPost) {
      return res.status(200).json(JSON.parse(cachedPost));
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    await redisClient.setex(cachedKey, 3600, JSON.stringify(post));

    return res.status(200).json(post);
  } catch (error) {
    logger.error("Get post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//* UPDATE POST
// export const updatePost = async (req: Request, res: Response) => {
//   logger.info("Update post endpoint hit...");
//   try {
//   } catch (error) {
//     logger.error("Update post error occurred", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

//* DELETE POST
export const deletePost = async (req: Request, res: Response) => {
  logger.info("Delete post endpoint hit...");
  try {
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

    const deletedPost = await PostModel.findOneAndDelete({
      _id: postId,
      user: req.user!.userId,
    });

    if (!deletedPost) {
      logger.error("Post for deleting not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    await invalidatePostsCache(postId);

    return res
      .status(200)
      .json({ success: true, message: "Post successfully deleted" });
  } catch (error) {
    logger.error("Delete post error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
