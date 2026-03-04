import { describe, expect, it } from "vitest";
import { AppError, UnauthorizedError } from "../../../src/utils/AppError.js";

describe("UnauthorizedError", () => {
  it("should set statusCode 401", () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
    expect(error).toBeInstanceOf(AppError);
  });

  it("should set custom error message", () => {
    const error = new UnauthorizedError("Custom error");

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Custom error");
    expect(error).toBeInstanceOf(AppError);
  });
});
