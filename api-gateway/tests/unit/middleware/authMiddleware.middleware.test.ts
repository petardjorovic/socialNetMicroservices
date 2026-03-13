import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createMockContext } from "../../express.js";
import authMiddleware from "../../../src/middlewares/authMiddleware.js";

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

    req.headers = {
      authorization: "",
    };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });
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
  });
});
