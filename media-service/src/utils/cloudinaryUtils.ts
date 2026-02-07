import { UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import "multer";
import cloudinary from "../config/cloudinaryConfig.js";
import logger from "./logger.js";

export const uploadMediaToCloudinary = (
  file: Express.Multer.File,
): Promise<UploadApiResponse> => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const isVideo = file.mimetype.startsWith("video/");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "image",
        folder: isVideo ? "media-service/videos" : "media-service/images",
        public_id: `${baseName}_${Date.now()}_${crypto.randomUUID()}`,
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }

        if (!result) {
          return reject(new Error("Failed to upload media to Cloudinary"));
        }

        return resolve(result);
      },
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video",
) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (res.result !== "ok" && res.result !== "not found") {
      throw new Error(`Unexpected Cloudinary delete result: ${res.result}`);
    }
    logger.info("Media deleted from Cloudinary", {
      publicId,
      resourceType,
      result: res.result,
    });
    return res;
  } catch (error) {
    logger.error("Error deleting media from Cloudinary", {
      publicId,
      resourceType,
      error,
    });
    throw error;
  }
};
