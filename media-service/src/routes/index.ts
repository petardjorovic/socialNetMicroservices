import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadMedia } from "../controllers/media.controller.js";
import { imageUpload, videoUpload } from "../middlewares/multerMiddleware.js";

const mediaRouter = Router();

mediaRouter.use(authMiddleware);

mediaRouter.post("/upload/image", imageUpload.single("image"), uploadMedia);
mediaRouter.post("/upload/video", videoUpload.single("video"), uploadMedia);

export default mediaRouter;
