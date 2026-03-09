import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { type RedisReply } from "rate-limit-redis";
import proxy, { ProxyOptions } from "express-http-proxy";
import {
  IncomingMessage,
  OutgoingHttpHeaders,
  RequestOptions,
} from "node:http";
import logger from "./utils/logger.js";
import redisClient from "./utils/redis.js";
import {
  IDENTITY_SERVICE_URL,
  MEDIA_SERVICE_URL,
  POST_SERVICE_URL,
  SEARCH_SERVICE_URL,
} from "./utils/env.js";
import { configurationCors } from "./middlewares/configurationCors.js";
import requestIdMiddleware from "./middlewares/requestIdMiddleware.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import errorHandler from "./middlewares/errorHandler.js";

export const app = express();
//TODO app.set("trust proxy", 1); // ako budem iza proxija

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

app.get("/health", (_, res) => {
  return res.status(200).json({ status: "ok" });
});

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
      // if (!srcReq.headers["content-type"]?.startsWith("multipart/form-data")) {
      //   proxyReqOpts.headers["Content-Type"] = "multipart/form-data";
      // }  //* ne treba ovo jer express-http-proxy sam postavlja content-type na multipart/form-data kad detektuje da je body stream
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

// setting up proxy for our search service
app.use(
  "/v1/search",
  authMiddleware,
  proxy(SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (
      proxyReqOpts: Omit<RequestOptions, "headers"> & {
        headers: OutgoingHttpHeaders;
      },
      srcReq: Request,
    ) => {
      proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
      proxyReqOpts.headers["x-user-id"] = srcReq.user?.userId;
      return proxyReqOpts;
    },
    userResDecorator: (
      proxyRes: IncomingMessage,
      proxyResData: any,
      userReq: Request,
      userRes: Response,
    ) => {
      logger.info(
        `Response received from Search service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorHandler);
