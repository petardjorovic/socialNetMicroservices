import { NODE_ENV } from "./../utils/env.js";
import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.stack);

  const message =
    NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(500).json({
    message,
  });
};

export default errorHandler;
