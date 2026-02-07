import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getMedias, uploadMedia } from "../controllers/media.controller.js";
import { imageUpload, videoUpload } from "../middlewares/multerMiddleware.js";

const mediaRouter = Router();

// prefix /media

mediaRouter.use(authMiddleware);

mediaRouter.get("/", getMedias);
mediaRouter.post("/upload/image", imageUpload.single("image"), uploadMedia);
mediaRouter.post("/upload/video", videoUpload.single("video"), uploadMedia);

export default mediaRouter;
