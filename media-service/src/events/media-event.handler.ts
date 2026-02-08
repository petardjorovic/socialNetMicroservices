import MediaModel from "../models/media.model.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinaryUtils.js";
import logger from "../utils/logger.js";

export interface PostDeletedEvent {
  postId: string;
  userId: string;
  mediaIds: string[];
}

export const handlePostDelete = async (event: PostDeletedEvent) => {
  logger.info("Handling post.deleted event", { postId: event.postId });

  if (!event.mediaIds?.length) return;

  for (const publicId of event.mediaIds) {
    try {
      const media = await MediaModel.findOne({ publicId });
      if (!media) continue;
      await deleteMediaFromCloudinary(
        publicId,
        media.mimeType.startsWith("video/") ? "video" : "image",
      );
      await MediaModel.deleteOne({ publicId });
    } catch (error) {
      logger.error("Failed to delete media for post.deleted", {
        publicId,
        error,
      });
    }
  }
};
