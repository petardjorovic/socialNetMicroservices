import SearchPostModel from "../models/search-post.model.js";
import logger from "../utils/logger.js";

export interface PostCreateEvent {
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface PostDeleteEvent {
  postId: string;
  userId: string;
  mediaIds: string[];
}

export const handlePostCreate = async (event: PostCreateEvent) => {
  logger.info("Handling post.created event", { postId: event.postId });
  try {
    const result = await SearchPostModel.updateOne(
      {
        postId: event.postId,
      },
      {
        $setOnInsert: {
          postId: event.postId,
          userId: event.userId,
          content: event.content,
          createdAt: new Date(event.createdAt),
        },
      },
      {
        upsert: true, // ako ne postoji post sa ovim postId onda napravi novi
      },
    );

    if (result.upsertedCount > 0) {
      logger.info(`Search post inserted: ${event.postId}`);
    } else {
      logger.info(`Search post already exists: ${event.postId}`);
    }
  } catch (error) {
    logger.error(`Create search post error for postId: ${event.postId}`, error);
  }
};

export const handlePostDelete = async (event: PostDeleteEvent) => {
  logger.info("Handling post.deleted event", { postId: event.postId });

  try {
    const result = await SearchPostModel.findOneAndDelete({
      postId: event.postId,
    });

    if (result) {
      logger.info(`Search post deleted: ${event.postId}`);
    } else {
      logger.info(`Search post already deleted: ${event.postId}`);
    }
  } catch (error) {
    logger.error(`Delete search post error for postId: ${event.postId}`, error);
  }
};
