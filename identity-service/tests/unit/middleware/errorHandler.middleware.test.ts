import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../src/utils/AppError.js";
import { errorHandler } from "../../../src/middlewares/errorHandler.js";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

import logger from "../../../src/utils/logger.js";

describe("errorHandler middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {};
    mockNext = vi.fn();

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should handle AppError correctly", () => {
    const error = new AppError("Custom error", 400);

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(error.stack);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Custom error",
    });
  });

  it("should handle generic error with 500", () => {
    const error = new Error("Something broke");

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(error.stack);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });
});
