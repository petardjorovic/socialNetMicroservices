import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("../../../src/repositories/user.repository.js", () => ({
  findUserByEmailOrUsername: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("../../../src/utils/crypto.js", () => ({
  hashPassword: vi.fn(),
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

import {
  createUser,
  findUserByEmailOrUsername,
} from "../../../src/repositories/user.repository.js";
import { hashPassword } from "../../../src/utils/crypto.js";
import { generateTokens } from "../../../src/utils/generateToken.js";
import { registerUser } from "../../../src/services/user.service.js";

describe("registerUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return tokens if user saved successfully", async () => {
    const userDto = {
      username: "test",
      email: "test@test.com",
      password: "123456",
    };

    const newlyCreatedUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "hashed",
    } as any;

    const mockTokens = {
      accessToken: "access",
      refreshToken: "refresh",
    };

    vi.mocked(findUserByEmailOrUsername).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(createUser).mockResolvedValue(newlyCreatedUser);
    vi.mocked(generateTokens).mockResolvedValue(mockTokens);

    const result = await registerUser(userDto);

    expect(findUserByEmailOrUsername).toHaveBeenCalledWith(userDto);
    expect(hashPassword).toHaveBeenCalledWith("123456");
    expect(generateTokens).toHaveBeenCalledWith(newlyCreatedUser);
    expect(result).toEqual(mockTokens);
  });

  it("should throw if user exist", async () => {
    vi.mocked(findUserByEmailOrUsername).mockResolvedValue({
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "hashed",
      __v: 1,
    });

    await expect(
      registerUser({
        username: "test",
        email: "test@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("User already exists");

    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(generateTokens).not.toHaveBeenCalled();
  });

  it("should propagate error if createUser fail", async () => {
    vi.mocked(findUserByEmailOrUsername).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(createUser).mockRejectedValue(new Error("DB error"));

    await expect(
      registerUser({
        username: "test",
        email: "test@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("DB error");

    expect(generateTokens).not.toHaveBeenCalled();
  });
});
