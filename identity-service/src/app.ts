import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { RedisReply, RedisStore } from "rate-limit-redis";
import logger from "./utils/logger.js";
import redisClient from "./utils/redis.js";
import { configurationCors } from "./middlewares/configurationCors.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import router from "./routes/identity-servise.route.js";
import { NODE_ENV } from "./utils/env.js";

const isTest = NODE_ENV === "test";

export const app = express();
app.set("trust proxy", 1); //* ovo treba dodati kad odradis apiGateway

// middlewares
app.use(helmet());
app.use(configurationCors());
app.use(express.json());

if (!isTest) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    // Avoid logging sensitive fields like password, token, etc.
    if (req.body && typeof req.body === "object") {
      const { password, token, ...safeBody } = req.body;
      logger.info(`Request body, ${JSON.stringify(safeBody)}`);
    }
    next();
  });

  // DDos protection and rate limiting
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10, // user can make 10 requests
    duration: 1, // in 1 seconds
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    // const key = req.ip ?? "unknown-ip";
    const key = req.ip;

    if (!key) {
      logger.warn("Request with undefined IP rejected");
      return res
        .status(400)
        .json({ success: false, message: "Unable to identify client" });
    }

    rateLimiter
      .consume(key)
      .then(() => next())
      .catch((err) => {
        if (err && typeof err.msBeforeNext === "number") {
          logger.warn(`Rate limit exceeded for IP: ${key}`);
          return res
            .status(429)
            .json({ success: false, message: "Too many requests" });
        }
        logger.error("Rate limiter error", err);
        return next(err);
      });
  });

  // IP based rate limiting for sensitive endpoints
  const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redisClient.call(command, ...args) as Promise<RedisReply>,
    }),
  });

  // apply this sensitiveEndpointsLimiter to our routes
  app.use("/api/auth/register", sensitiveEndpointsLimiter);
}

// Routes
app.use("/api/auth", router);

// Error Handler
app.use(errorHandler);
