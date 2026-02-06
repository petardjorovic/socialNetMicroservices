import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import "multer";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "./env.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadMediaToCloudinary = (
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

export default uploadMediaToCloudinary;
