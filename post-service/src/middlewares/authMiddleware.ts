import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"];

  if (!userId || Array.isArray(userId)) {
    logger.warn("Access attempted without user ID");

    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login to continue.",
    });
  }

  req.user = { userId };
  next();
};

export default authMiddleware;
