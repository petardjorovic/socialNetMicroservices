import { describe, expect, it } from "vitest";
import { AppError, BadRequestError } from "../../../src/utils/AppError.js";

describe("BadRequestError", () => {
  it("should set statusCode 400", () => {
    const error = new BadRequestError();

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(BadRequestError);
  });

  it("should set custom error message", () => {
    const error = new BadRequestError("Custom error");

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Custom error");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(BadRequestError);
  });
});
