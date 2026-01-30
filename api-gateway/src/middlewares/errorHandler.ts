import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.stack);

  res.status(500).json({ message: err.message || "Internal server error" });
};

export default errorHandler;
