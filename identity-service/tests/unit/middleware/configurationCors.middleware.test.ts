import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "../../../src/middlewares/configurationCors.js";

describe("configurationCors middleware", () => {
  it("should allow undefined origin", () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it("should allow whitelisted origin", () => {
    expect(isOriginAllowed("http://localhost:5173")).toBe(true);
  });

  it("should block non-whitelisted origin", () => {
    expect(isOriginAllowed("http://evil.com")).toBe(false);
  });
});
