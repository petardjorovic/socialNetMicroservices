import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { Redis } from "ioredis";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { type RedisReply } from "rate-limit-redis";
import configurationCors from "./middlewares/configurationCors.js";
import { IDENTITY_SERVICE_URL, PORT, REDIS_URL } from "./utils/env.js";
import logger from "./utils/logger.js";
import proxy, { ProxyOptions } from "express-http-proxy";
import errorHandler from "./middlewares/errorHandler.js";
import {
  IncomingMessage,
  OutgoingHttpHeaders,
  RequestOptions,
} from "node:http";
import crypto from "crypto";

const app = express();
//TODO app.set("trust proxy", 1); // ako budem iza proxija

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (err) => {
  logger.error("Redis connection error", err);
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

// middlewares
app.use(helmet());
app.use(configurationCors());
app.use(express.json());

// rate limiting
const rateLimiter = rateLimit({
  // Rate limiter configuration
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Express request handler that sends back a response when a client is rate-limited
  handler: (req: Request, res: Response) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP ${req.ip}`);
    return res
      .status(429)
      .json({ success: false, message: "Too many requests" });
  },
  // Redis store configuration
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<RedisReply>,
  }),
});

app.use(rateLimiter);

// logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info(
      `method: ${req.method}, url: ${req.originalUrl}, ip: ${req.ip}, status: ${res.statusCode}, durationMs: ${duration}`,
    );
  });

  next();
});

const proxyOptions: ProxyOptions = {
  proxyReqPathResolver: function (req: Request) {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err: any, res: Response, next: NextFunction) => {
    logger.error(`Proxy error: ${err.message}`);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  },
};

// setting up proxy for our identity service
app.use(
  "/v1/auth",
  proxy(IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (
      proxyReqOpts: Omit<RequestOptions, "headers"> & {
        headers: OutgoingHttpHeaders;
      },
      srcReq: Request,
    ) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      //TODO   proxyReqOpts.headers["authorization"] = srcReq.headers.authorization;
      //TODO   const requestId = srcReq.headers["x-request-id"] ?? crypto.randomUUID();
      return proxyReqOpts;
    },
    userResDecorator: (
      proxyRes: IncomingMessage,
      proxyResData: any,
      userReq: Request,
      userRes: Response,
    ) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Identity service is running on url ${IDENTITY_SERVICE_URL}`);
  logger.info(`Redis Url ${REDIS_URL} `);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await redisClient.quit();
  //   await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Optionally handle uncaught errors
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err}`);
  gracefulShutdown("uncaughtException");
});
