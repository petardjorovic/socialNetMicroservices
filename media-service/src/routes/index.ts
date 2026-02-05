import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

const mediaRouter = Router();

mediaRouter.use(authMiddleware);

export default mediaRouter;
