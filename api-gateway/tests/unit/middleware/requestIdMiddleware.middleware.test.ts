import { describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../express.js";
import requestIdMiddleware from "../../../src/middlewares/requestIdMiddleware.js";

describe("requestId middleware", () => {
  it("should generate request id if header is missing", () => {
    const { req, res, next } = createMockContext();

    req.headers = {};

    const setHeader = vi.fn();

    res.setHeader = setHeader;

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(req.headers["x-request-id"]).toBe(req.requestId);
    expect(res.locals.requestId).toBe(req.requestId);
    expect(setHeader).toHaveBeenCalledWith("X-Request-Id", req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it("should reuse existing request id", () => {
    const { req, res, next } = createMockContext();

    req.headers = { "x-request-id": "existing-id" };

    const setHeader = vi.fn();

    res.setHeader = setHeader;

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe("existing-id");
    expect(res.locals.requestId).toBe("existing-id");
    expect(setHeader).toHaveBeenCalledWith("X-Request-Id", "existing-id");
    expect(next).toHaveBeenCalled();
  });
});
