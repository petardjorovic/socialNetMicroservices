import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    warn: vi.fn(),
  },
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

import { validateRequest } from "../../../src/middlewares/validateRequest.js";
import logger from "../../../src/utils/logger.js";

describe("validateRequest middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call next() if body is valid", async () => {
    const schema = z.object({ name: z.string() });
    const req: any = { body: { name: "Test" } };
    const res = mockResponse();
    const next = vi.fn();

    const middleware = validateRequest(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: "Test" });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should return 400 and not call next() if body is invalid", async () => {
    const schema = z.object({ name: z.string() });
    const req: any = {
      body: {
        name: 123,
      },
    };
    const res = mockResponse();
    const next = vi.fn();

    const middleware = validateRequest(schema);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.any(Array) }),
    );
    expect(logger.warn).toHaveBeenCalled();
  });
});
