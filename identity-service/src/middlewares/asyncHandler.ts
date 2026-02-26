import { RequestHandler } from "express";

export const asyncHandler: (controller: RequestHandler) => RequestHandler =
  (controller) => async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
