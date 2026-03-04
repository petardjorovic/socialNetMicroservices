import { describe, expect, it } from "vitest";
import { AppError, NotFoundError } from "../../../src/utils/AppError.js";

describe("NotFoundError", () => {
  it("should set statusCode 404", () => {
    const error = new NotFoundError();

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Resource not found");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it("should set custom error message", () => {
    const error = new NotFoundError("Custom error");

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Custom error");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
  });
});
