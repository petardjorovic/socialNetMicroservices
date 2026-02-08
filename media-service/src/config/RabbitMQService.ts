import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import { RABBITMQ_URL, REDIS_URL } from "../utils/env.js";
import logger from "../utils/logger.js";

const EXCHANGE_NAME = "my_network_events";

interface ConsumerConfig<T> {
  routingKey: string;
  callback: (content: T) => Promise<void>;
}

class RabbitMQService {
  private static instance: RabbitMQService;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnecting: boolean = false;
  private isShuttingDown: boolean = false;
  private pendingMessages: number = 0;
  private consumers: ConsumerConfig<any>[] = [];

  private constructor() {}

  public static getInstance() {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  public async connect(): Promise<Channel> {
    if (this.channel) return this.channel;
    if (this.isConnecting) {
      // wait dok se konekcija ne završi
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(interval);
          reject(new Error("Timed out waiting for RabbitMQ connection"));
        }, 30_000);
        const interval = setInterval(() => {
          if (this.channel) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve(this.channel);
          }
        }, 50);
      });
    }

    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(RABBITMQ_URL);

      this.connection.on("close", async () => {
        if (this.isShuttingDown) return; // NE reconnectujemo ako je shutdown
        logger.error("RabbitMQ connection closed, reconnecting...");
        this.channel = null;
        this.isConnecting = false;
        await this.connect();
      });

      this.connection.on("error", (err) => {
        logger.error("RabbitMQ connection error", err);
        this.channel = null;
      });

      this.channel = await this.connection.createChannel();
      this.channel.prefetch(10); // adjust based on expected throughput
      await this.channel.assertExchange(EXCHANGE_NAME, "direct", {
        durable: true,
      });

      logger.info("Connected to RabbitMQ");

      // Replay stored consumers after channel is created
      await this.replayConsumers();

      this.isConnecting = false;
      return this.channel;
    } catch (error) {
      logger.error("Error connecting to RabbitMQ", error);
      this.isConnecting = false;

      // retry nakon 5 sekundi
      await new Promise((r) => setTimeout(r, 5000));
      return this.connect();
    }
  }

  public async publish(routingKey: string, message: any) {
    const ch = await this.connect();
    ch.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    logger.info(`Published event: ${routingKey}`);
  }

  public async consume<T>(
    routingKey: string,
    callback: (content: T) => Promise<void>,
  ) {
    // Store consumer config for replay on reconnection
    const consumerIndex = this.consumers.findIndex(
      (c) => c.routingKey === routingKey,
    );

    if (consumerIndex === -1) {
      this.consumers.push({ routingKey, callback });
    } else {
      this.consumers[consumerIndex] = { routingKey, callback };
    }

    const ch = await this.connect();
    await this.registerConsumer(ch, routingKey, callback);
  }

  private async registerConsumer<T>(
    ch: Channel,
    routingKey: string,
    callback: (content: T) => Promise<void>,
  ): Promise<void> {
    const queueName = `media_service_${routingKey}`;

    const q = await ch.assertQueue(queueName, { durable: true });
    await ch.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    await ch.consume(q.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      this.pendingMessages++;
      try {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        ch.ack(msg);
      } catch (error) {
        logger.error("Failed processing message", error);
        ch.nack(msg, false, true); // ponovo stavlja u queue
      } finally {
        this.pendingMessages--;
      }
    });

    logger.info(`Subscribed to event: ${routingKey}`, { queue: q.queue });
  }

  private async replayConsumers(): Promise<void> {
    if (!this.channel) {
      logger.warn("Cannot replay consumers: channel is null");
      return;
    }

    if (this.consumers.length === 0) {
      logger.debug("No consumers to replay");
      return;
    }

    for (const consumer of this.consumers) {
      try {
        await this.registerConsumer(
          this.channel,
          consumer.routingKey,
          consumer.callback,
        );
      } catch (error) {
        logger.error(
          `Failed to replay consumer for ${consumer.routingKey}`,
          error,
        );
      }
    }

    logger.info(`Replayed ${this.consumers.length} consumer(s)`);
  }

  public async close(): Promise<void> {
    this.isShuttingDown = true;
    try {
      const maxWait = 30_000;
      const start = Date.now();
      while (this.pendingMessages > 0) {
        if (Date.now() - start > maxWait) {
          logger.warn(
            `Force closing with ${this.pendingMessages} pending messages`,
          );
          break;
        }
        logger.info(`Waiting for ${this.pendingMessages} pending messages...`);
        await new Promise((r) => setTimeout(r, 100)); // check na svakih 100ms
      }
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      logger.info("RabbitMQ connection closed gracefully");
    } catch (error) {
      logger.error("Error closing RabbitMQ connection", error);
    }
  }
}

const rabbitMQService = RabbitMQService.getInstance();
export default rabbitMQService;

// import rabbitMQService from "./utils/rabbitmq";

// await rabbitMQService.connect();
// await rabbitMQService.consume("post.deleted", handlePostDelete);
// await rabbitMQService.publish("post.created", { id: 123, title: "Hello" });
