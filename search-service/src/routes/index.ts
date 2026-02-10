import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getSearchedPosts } from "../controllers/search-post.controller.js";

const searchRouter = Router();

// prefix /search

searchRouter.use(authMiddleware); // Apply auth middleware to all search routes

searchRouter.get("/posts", getSearchedPosts);

export default searchRouter;
