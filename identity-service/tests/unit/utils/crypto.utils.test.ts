import { describe, it, expect } from "vitest";
import { hashPassword, validatePassword } from "../../../src/utils/crypto.js";

describe("Password utils", () => {
  it("should hash password", async () => {
    const plain = "secret123";

    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(typeof hashed).toBe("string");
    expect(hashed.length).toBeGreaterThan(20);
  });

  it("should validate correct password", async () => {
    const plain = "secret123";

    const hashed = await hashPassword(plain);

    const isValid = await validatePassword(plain, hashed);

    expect(isValid).toBe(true);
  });

  it("should return false for wrong password", async () => {
    const plain = "secret123";
    const wrong = "wrongPassword";

    const hashed = await hashPassword(plain);

    const isValid = await validatePassword(wrong, hashed);

    expect(isValid).toBe(false);
  });
});
