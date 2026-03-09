import { describe, expect, it, vi } from "vitest";
import errorHandler from "../../../src/middlewares/errorHandler.js";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

import logger from "../../../src/utils/logger.js";
import { createMockContext } from "../../express.js";

describe("errorHandler middleware", () => {
  it("should return 500 and default error message", () => {
    const { req, res, next } = createMockContext();

    errorHandler(new Error(""), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(logger.error).toHaveBeenCalled();
  });

  it("should return 500 and custom error message", () => {
    const { req, res, next } = createMockContext();

    errorHandler(new Error("Custom error"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Custom error" });
    expect(logger.error).toHaveBeenCalled();
  });
});
