import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
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

  it("should allow access with valid token", async () => {
    const token = jwt.sign(
      { userId: "test123", username: "test" },
      process.env.JWT_SECRET!,
    );

    const res = await request(app)
      .get("/v1/posts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).not.toBe(401);
  });
});
