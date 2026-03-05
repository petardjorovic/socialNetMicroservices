import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore, { type RedisReply } from "rate-limit-redis";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import redisClient from "./config/redis.js";
import mediaRouter from "./routes/index.js";

export const app = express();
app.set("trust proxy", 1);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP ${req.ip}`);
    return res
      .status(429)
      .json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<RedisReply>,
  }),
});

app.use(limiter);

// logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `method: ${req.method}, url: ${req.originalUrl}, ip: ${req.ip}, status: ${res.statusCode}, durationMs: ${duration}`,
    );
  });

  next();
});

app.use("/api/media", mediaRouter);

app.use(errorHandler);
