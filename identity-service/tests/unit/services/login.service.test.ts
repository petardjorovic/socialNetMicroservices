import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("../../../src/repositories/user.repository.js", () => ({
  findUserByEmail: vi.fn(),
}));

vi.mock("../../../src/utils/crypto.js", () => ({
  validatePassword: vi.fn(),
}));

vi.mock("../../../src/utils/generateToken.js", () => ({
  generateTokens: vi.fn(),
}));

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { findUserByEmail } from "../../../src/repositories/user.repository.js";
import { validatePassword } from "../../../src/utils/crypto.js";
import { generateTokens } from "../../../src/utils/generateToken.js";
import { loginUser } from "../../../src/services/user.service.js";

describe("loginUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return tokens when credentials are valid", async () => {
    const mockUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "hashed",
    } as any;

    const mockTokens = {
      accessToken: "acccess",
      refreshToken: "refresh",
    };

    vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(validatePassword).mockResolvedValue(true);
    vi.mocked(generateTokens).mockResolvedValue(mockTokens);

    const result = await loginUser({
      email: "test@test.com",
      password: "123456",
    });

    expect(findUserByEmail).toHaveBeenCalledWith("test@test.com");
    expect(validatePassword).toHaveBeenCalledWith("123456", "hashed");
    expect(generateTokens).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockTokens);
  });

  it("should throw if user not exist", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await expect(
      loginUser({ email: "wrong@test.com", password: "123456" }),
    ).rejects.toThrow("Invalid credentials");

    expect(validatePassword).not.toHaveBeenCalled();
    expect(generateTokens).not.toHaveBeenCalled();
  });

  it("should throw if password not valid", async () => {
    const mockUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "hashed",
    } as any;

    vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(validatePassword).mockResolvedValue(false);

    await expect(
      loginUser({ email: "test@test.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
    expect(generateTokens).not.toHaveBeenCalled();
  });

  it("should propagate error if validatePassword fails", async () => {
    const mockUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "hashed",
    } as any;

    vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(validatePassword).mockRejectedValue(
      new Error("unexpected error"),
    );

    await expect(
      loginUser({ email: "test@test.com", password: "123456" }),
    ).rejects.toThrow("unexpected error");

    expect(generateTokens).not.toHaveBeenCalled();
  });
});
