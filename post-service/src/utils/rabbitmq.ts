import amqp, { Channel, ChannelModel } from "amqplib";
import logger from "./logger.js";
import { RABBITMQ_URL } from "./env.js";

let conn: ChannelModel | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = "social_network_events";

export const connectToRabbitMQ = async (): Promise<Channel> => {
  try {
    conn = await amqp.connect(RABBITMQ_URL);

    conn.on("close", () => {
      logger.error("RabbitMQ connection closed");
      channel = null;
    });

    conn.on("error", (err) => {
      logger.error("RabbitMQ connection error", err);
      channel = null;
    });

    channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });

    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ", error);
    throw error;
  }
};

export const publishEvent = async (routingKey: string, message: unknown) => {
  if (!channel) await connectToRabbitMQ();

  channel?.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true },
  );
  logger.info(`Event published: ${routingKey}`);
};
