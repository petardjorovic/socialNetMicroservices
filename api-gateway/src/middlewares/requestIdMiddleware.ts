import { NextFunction, Request, Response } from "express";

const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers["x-request-id"]) {
    req.requestId = crypto.randomUUID();
    req.headers["x-request-id"] = req.requestId;
  } else {
    req.requestId = req.headers["x-request-id"] as string;
  }

  res.setHeader("X-Request-Id", req.requestId);

  // Stavljamo requestId i u res.locals da bude lako dostupan kasnije
  res.locals.requestId = req.requestId;
  next();
};

export default requestIdMiddleware;
