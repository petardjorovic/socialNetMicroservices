import rabbitMQService from "../config/RabbitMQService.js";
import { handlePostDelete, PostDeletedEvent } from "./media-event.handler.js";

export const registerConsumers = async () => {
  await rabbitMQService.consume<PostDeletedEvent>(
    "post.delete",
    handlePostDelete,
  );
};
