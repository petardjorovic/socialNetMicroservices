import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";
import { getConfig } from "../utils/env.js";

const { NODE_ENV } = getConfig();

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.stack);

  const message =
    NODE_ENV === "development" ? err.message : "Internal server error";

  return res.status(500).json({ message });
};

export default errorHandler;
