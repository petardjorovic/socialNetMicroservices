import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
} from "../controllers/post.controller.js";

const postRouter = Router();

postRouter.use(authMiddleware);

// prefix /posts

postRouter.get("/", getPosts);
postRouter.get("/:id", getPost);
postRouter.post("/", createPost);
postRouter.delete("/:id", deletePost);

export default postRouter;
