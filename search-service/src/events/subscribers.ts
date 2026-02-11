import rabbitMQService from "../config/RabbitMQService.js";
import {
  handlePostCreate,
  handlePostDelete,
  handlePostUpdate,
  PostCreateEvent,
  PostDeleteEvent,
  PostUpdateEvent,
} from "./search-event.handler.js";

export const registerConsumers = async () => {
  await rabbitMQService.consume<PostCreateEvent>(
    "post.created",
    handlePostCreate,
  );

  await rabbitMQService.consume<PostUpdateEvent>(
    "post.updated",
    handlePostUpdate,
  );

  await rabbitMQService.consume<PostDeleteEvent>(
    "post.deleted",
    handlePostDelete,
  );
};
