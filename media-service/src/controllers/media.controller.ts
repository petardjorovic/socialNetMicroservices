import { Request, Response } from "express";
import logger from "../utils/logger.js";
import uploadMediaToCloudinary from "../utils/cloudinaryConfig.js";
import MediaModel from "../models/media.model.js";

export const uploadMedia = async (req: Request, res: Response) => {
  logger.info("Received media upload request");
  try {
    if (!req.file) {
      logger.error("No file found. Please add a file and try again");

      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again",
      });
    }

    const { originalname, mimetype } = req.file;
    const userId = req.user!.userId;

    logger.info(`File details name=${originalname}, type=${mimetype}`);
    logger.info(`Uploading to cloudinary starting...`);

    const cloudinaryUplaodResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload successful: ${cloudinaryUplaodResult.public_id}`,
    );

    const newlyCreatedMedia = new MediaModel({
      publicId: cloudinaryUplaodResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUplaodResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      mediaId: newlyCreatedMedia.publicId,
      url: newlyCreatedMedia.url,
    });
  } catch (error) {
    logger.error("Uplaod media error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
