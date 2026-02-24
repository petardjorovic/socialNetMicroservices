import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEnv, getConfig } from "../utils/env.js";

describe("env utils", () => {
  let OLD_ENV: NodeJS.ProcessEnv;

  beforeEach(() => {
    OLD_ENV = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("returns default value if env not set", () => {
    expect(getEnv("MY_VAR", "default")).toBe("default");
  });

  it("throws error if required env not set", () => {
    expect(() => getEnv("MISSING_ENV")).toThrow(
      "Missing environment variable MISSING_ENV",
    );
  });

  it("returns actual env value if set", () => {
    process.env["MY_ENV"] = "123";
    expect(getEnv("MY_ENV")).toBe("123");
  });

  it("getConfig returns all env values safely", () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "4000";
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_SECRET = "secret";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.RABBITMQ_URL = "amqp://localhost:5672";

    const config = getConfig();

    expect(config.NODE_ENV).toBe("test");
    expect(config.PORT).toBe("4000");
    expect(config.MONGO_URI).toBe("mongodb://localhost:27017/test");
    expect(config.JWT_SECRET).toBe("secret");
    expect(config.REDIS_URL).toBe("redis://localhost:6379");
    expect(config.RABBITMQ_URL).toBe("amqp://localhost:5672");
  });
});
