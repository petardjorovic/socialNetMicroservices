import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/env.js";
import logger from "../utils/logger.js";

type DecodedPayload = {
  userId: string;
  username: string;
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    logger.warn("Access attempted without valid token");
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error("Invalid token", err.message);
      return res
        .status(401)
        .json({ success: false, message: "Invalid jwt token" });
    }

    const payload = decoded as DecodedPayload;

    if (!payload?.userId || !payload?.username) {
      logger.error("JWT payload missing required fields");
      return res
        .status(401)
        .json({ success: false, message: "Invalid jwt token" });
    }

    req.user = payload;
    next();
  });
};

export default authMiddleware;
