import { describe, it, expect, afterAll, afterEach, beforeAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import crypto from "crypto";
import { app } from "../../src/app.js";
import { UserModel } from "../../src/models/user.model.js";
import { RefreshTokenModel } from "../../src/models/refresh-token.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({}),
    ),
  );
});

describe("Auth integration", () => {
  it("should register user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    expect(res.status).toBe(201);

    const userInDB = await UserModel.findOne({ email: "test@test.com" });
    expect(userInDB).not.toBeNull();
  });

  it("should return 400 if user already exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "User already exists",
    });
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(Array),
    });
  });

  it("should login user", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "User logged in successfully",
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(res.body).not.toHaveProperty("password");
    expect(res.body.accessToken).not.toBe(res.body.refreshToken);
  });

  it("should return 401 if user not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid credentials",
    });
  });

  it("should return 401 if password is not valid", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "wrongPassword" });

    const user = await UserModel.findOne({ email: "test@test.com" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid credentials",
    });
    expect(user?.password).not.toBe("123456");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "123456" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(Array),
    });
  });

  it("should return 200 if token is refreshed", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const oldRefreshToken = registerRes.body.refreshToken;

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: registerRes.body.refreshToken });

    const newRefreshToken = res.body.refreshToken;

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(res.body.accessToken).not.toBe(res.body.refreshToken);

    // new token exists
    const newTokenInDB = await RefreshTokenModel.findOne({
      token: newRefreshToken,
    });
    expect(newTokenInDB).not.toBeNull();

    // old token does not exist
    const oldTokenInDB = await RefreshTokenModel.findOne({
      token: oldRefreshToken,
    });
    expect(oldTokenInDB).toBeNull();
  });

  it("should return 400 if token is missing", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(Array),
    });
  });

  it("should return 401 if token does not exists", async () => {
    const fakeToken = crypto.randomBytes(40).toString("hex");
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: fakeToken });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid or expired refresh token",
    });
  });

  it("should return 401 if you try to refresh with old token", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const oldRefreshToken = registerRes.body.refreshToken;

    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid or expired refresh token",
    });
  });

  it("should return 400 if token is not valid", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "123456" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(Array),
    });
  });

  it("should logout user", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "test", password: "123456" });

    const oldRefreshToken = registerRes.body.refreshToken;

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "User logged out successfully",
    });

    const oldTokenInDB = await RefreshTokenModel.findOne({
      token: oldRefreshToken,
    });
    expect(oldTokenInDB).toBeNull();
  });

  it("should return 400 if token is missing", async () => {
    const res = await request(app).post("/api/auth/logout").send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(Array),
    });
  });
});
