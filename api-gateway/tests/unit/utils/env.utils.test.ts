import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEnv } from "../../../src/utils/env.js";

describe("getEnv", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should return environment variable if exists", () => {
    process.env.TEST_KEY = "value";

    const env = getEnv("TEST_KEY");

    expect(env).toBe("value");
  });

  it("should return default value if env not set", () => {
    delete process.env.TEST_KEY;

    const env = getEnv("TEST_KEY", "default");

    expect(env).toBe("default");
  });

  it("should throw error if env missing and no default", () => {
    delete process.env.TEST_KEY;

    expect(() => getEnv("TEST_KEY")).toThrow(
      "Missing environment variable TEST_KEY",
    );
  });
});
