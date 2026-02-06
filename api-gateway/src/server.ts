import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { type RedisReply } from "rate-limit-redis";
import configurationCors from "./middlewares/configurationCors.js";
import {
  IncomingMessage,
  OutgoingHttpHeaders,
  RequestOptions,
} from "node:http";
import proxy, { ProxyOptions } from "express-http-proxy";
import {
  IDENTITY_SERVICE_URL,
  MEDIA_SERVICE_URL,
  PORT,
  POST_SERVICE_URL,
  REDIS_URL,
} from "./utils/env.js";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import requestIdMiddleware from "./middlewares/requestIdMiddleware.js";
import redisClient from "./utils/redis.js";

const app = express();
//TODO app.set("trust proxy", 1); // ako budem iza proxija

let server: ReturnType<typeof app.listen> | undefined;

const start = () => {
  server = app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on url ${IDENTITY_SERVICE_URL}`);
    logger.info(`Post service is running on url ${POST_SERVICE_URL}`);
    logger.info(`Media service is running on url ${MEDIA_SERVICE_URL}`);
    logger.info(`Redis Url ${REDIS_URL} `);
  });
};

// middlewares
app.use(helmet());
app.use(configurationCors());
app.use(express.json());
app.use(requestIdMiddleware);

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
      `requestId: ${req.requestId}, method: ${req.method}, url: ${req.originalUrl}, ip: ${req.ip}, status: ${res.statusCode}, durationMs: ${duration}`,
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
      proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
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

// setting up proxy for our post service
app.use(
  "/v1/posts",
  authMiddleware,
  proxy(POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (
      proxyReqOpts: Omit<RequestOptions, "headers"> & {
        headers: OutgoingHttpHeaders;
      },
      srcReq: Request,
    ) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user?.userId;
      proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
      return proxyReqOpts;
    },
    userResDecorator: (
      proxyRes: IncomingMessage,
      proxyResData: any,
      userReq: Request,
      userRes: Response,
    ) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// setting up proxy for our media service
app.use(
  "/v1/media",
  authMiddleware,
  proxy(MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (
      proxyReqOpts: Omit<RequestOptions, "headers"> & {
        headers: OutgoingHttpHeaders;
      },
      srcReq: Request,
    ) => {
      proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
      proxyReqOpts.headers["x-user-id"] = srcReq.user?.userId;
      if (!srcReq.headers["content-type"]?.startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "multipart/form-data";
      }
      return proxyReqOpts;
    },
    userResDecorator: (
      proxyRes: IncomingMessage,
      proxyResData: any,
      userReq: Request,
      userRes: Response,
    ) => {
      logger.info(
        `Response received from Media service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
    parseReqBody: false, // important for file uploads
  }),
);

app.use(errorHandler);

void start();

const gracefulShutdown = async (signal: string, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await redisClient.quit();
    // await mongoose.connection.close();
  } catch (error) {
    logger.error("Shutdown error", error);
    exitCode = 1;
  }

  if (server) {
    server.close(() => process.exit(exitCode));
  } else {
    process.exit(exitCode);
  }
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  void gracefulShutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err}`);
  void gracefulShutdown("uncaughtException", 1);
});
