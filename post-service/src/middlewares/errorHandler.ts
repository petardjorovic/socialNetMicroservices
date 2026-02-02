import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.stack);

  return res
    .status(500)
    .json({ message: err.message || "Internal server error" });
};

export default errorHandler;
