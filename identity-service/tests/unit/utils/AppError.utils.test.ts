import { describe, expect, it } from "vitest";
import { AppError } from "../../../src/utils/AppError.js";

describe("AppError", () => {
  it("should set default values correctly", () => {
    const error = new AppError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should set custom status code", () => {
    const error = new AppError("Test error", 409, false);

    expect(error.statusCode).toBe(409);
    expect(error.isOperational).toBe(false);
  });
});
