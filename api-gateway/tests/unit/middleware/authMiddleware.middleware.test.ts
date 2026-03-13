import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../src/middlewares/authMiddleware.js";
import { createMockContext } from "../../express.js";

vi.mock("jsonwebtoken");

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("authMiddleware", () => {
  it("should return 401 if token is missing", () => {
    const { req, res, next } = createMockContext();

    req.headers = {};

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is invalid", () => {
    const { req, res, next } = createMockContext();

    req.headers = {
      authorization: "Bearer invalid-token",
    };

    vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
      cb(new Error("invalid"), null),
    );

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid jwt token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user and call next if token is valid", () => {
    const { req, res, next } = createMockContext();

    req.headers = {
      authorization: "Bearer valid-token",
    };

    vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
      cb(null, { userId: "test123", username: "test" }),
    );

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ userId: "test123", username: "test" });
  });

  it("should return 401 if payload is invalid", () => {
    const { req, res, next } = createMockContext();

    req.headers = {
      authorization: "Bearer valid-token",
    };

    vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
      cb(null, { userId: "test123" }),
    );

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid jwt token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
