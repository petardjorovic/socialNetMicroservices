import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("auth middleware", () => {
  it("should return 401 if no token provided", async () => {
    const res = await request(app).get("/v1/posts");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Authentication required",
    });
  });
});
