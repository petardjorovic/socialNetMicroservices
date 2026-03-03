import { beforeEach, describe, it, vi, expect } from "vitest";
import bcrypt from "bcrypt";
import { hashPassword, validatePassword } from "../../../src/utils/crypto.js";

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe("hashPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call bcrypt.hash with default saltRounds = 10", async () => {
    (bcrypt.hash as any).mockResolvedValue("hashed-value");

    await hashPassword("plain-password");

    expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 10);
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  });

  it("should call bcrypt.hash with custom saltRounds", async () => {
    (bcrypt.hash as any).mockResolvedValue("hashed-value");

    await hashPassword("plain-password", 12);

    expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 12);
  });

  it("should call bcrypt.compare with correct args", async () => {
    (bcrypt.compare as any).mockResolvedValue(true);

    await validatePassword("plain", "hashed");

    expect(bcrypt.compare).toHaveBeenCalledWith("plain", "hashed");
  });
});
