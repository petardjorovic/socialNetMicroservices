import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import logger from "../utils/logger.js";

export const validateRequest =
  (schema: ZodType<any, any, any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      logger.warn("Validation error", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        error: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    req.body = result.data; // override sa parsed data
    next();
  };
