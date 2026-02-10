import rabbitMQService from "../config/RabbitMQService.js";
import {
  handlePostCreate,
  handlePostDelete,
  PostCreateEvent,
  PostDeleteEvent,
} from "./search-event.handler.js";

export const registerConsumers = async () => {
  await rabbitMQService.consume<PostCreateEvent>(
    "post.created",
    handlePostCreate,
  );
  await rabbitMQService.consume<PostDeleteEvent>(
    "post.deleted",
    handlePostDelete,
  );
};
