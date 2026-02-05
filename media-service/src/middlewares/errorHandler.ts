import { ErrorRequestHandler } from "express";
import logger from "../utils/logger.js";
import { NODE_ENV } from "../utils/env.js";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const message =
    NODE_ENV === "development" ? err.message : "Internal server error";

  return res.status(500).json({ message });
};

export default errorHandler;
