import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "../../../src/middlewares/asyncHandler.js";

describe("asyncHandler middleware", () => {
  it("should call controller", async () => {
    const controller = vi.fn().mockResolvedValue(undefined);

    const handler = asyncHandler(controller);

    const req: any = {};
    const res: any = {};
    const next: any = vi.fn();

    await handler(req, res, next);

    expect(controller).toHaveBeenCalledWith(req, res, next);
  });

  it("should call next with error if controller throws", async () => {
    const error = new Error("Boom");
    const controller = vi.fn().mockRejectedValue(error);

    const handler = asyncHandler(controller);

    const req: any = {};
    const res: any = {};
    const next: any = vi.fn();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
