import { Request, Response, NextFunction } from "express";
import { vi } from "vitest";

export const createMockContext = () => {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    locals: {} as any,
  } as unknown as Response;
  const next = vi.fn() as NextFunction;

  return { req, res, next };
};
