import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import searchRouter from "./routes/index.js";
import { rateLimit } from "express-rate-limit";
import RedisStore, { type RedisReply } from "rate-limit-redis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import redisClient from "./config/redis.js";

export const app = express();
app.set("trust proxy", 1);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // user can make 10 requests
  duration: 1, // in 1 seconds
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  // const key = req.ip ?? "unknown-ip";
  const key = req.ip;

  if (!key) {
    logger.warn("Request with undefined IP rejected");
    return res
      .status(400)
      .json({ success: false, message: "Unable to identify client" });
  }

  try {
    const rate = await rateLimiter.consume(key);
    next();
  } catch (err: any) {
    if (err && typeof err.msBeforeNext === "number") {
      logger.warn(`Rate limit exceeded for IP: ${key}`);
      return res
        .status(429)
        .json({ success: false, message: "Too many requests" });
    }
    logger.error("Rate limiter error", err);
    return next(err);
  }
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
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

app.use(sensitiveEndpointsLimiter);

// logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(
      `method: ${req.method}, url: ${req.originalUrl}, ip: ${req.ip}, status: ${res.statusCode}, durationMs: ${duration}`,
    );
  });

  next();
});

app.use("/api/search", searchRouter);

app.use(errorHandler);
