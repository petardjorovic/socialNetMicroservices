import { ErrorRequestHandler, Request, Response } from "express";
import multer from "multer";
import logger from "../utils/logger.js";
import { NODE_ENV } from "../utils/env.js";

const multerErrorHandler = (res: Response, err: multer.MulterError) => {
  logger.error("Multer error while uploading", err);
  return res.status(400).json({
    success: false,
    message: err.message,
  });
};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const message =
    NODE_ENV === "development" ? err.message : "Internal server error";
  const statusCode = err.status || err.statusCode || 500;

  if (err instanceof multer.MulterError) multerErrorHandler(res, err);

  return res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
