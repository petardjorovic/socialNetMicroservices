import { vi, describe, beforeEach, it, expect } from "vitest";
import { Types } from "mongoose";

vi.mock("../../../src/repositories/refresh-token.repository.js", () => ({
  findOneTokenAndDelete: vi.fn(),
}));

vi.mock("../../../src/repositories/user.repository.js", () => ({
  findUserById: vi.fn(),
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

import { findOneTokenAndDelete } from "../../../src/repositories/refresh-token.repository.js";
import { findUserById } from "../../../src/repositories/user.repository.js";
import { generateTokens } from "../../../src/utils/generateToken.js";
import { refreshToken } from "../../../src/services/user.service.js";
import { UnauthorizedError } from "../../../src/utils/AppError.js";

describe("refreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return new access and refresh token if old token is valid", async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const mockToken = {
      _id: new Types.ObjectId(),
      token: "oldRefreshToken",
      user: new Types.ObjectId(),
      expiresAt,
    } as any;

    const mockUser = {
      _id: mockToken.user,
      username: "test",
      email: "test@test.com",
      password: "hashed",
    } as any;

    const mockTokens = {
      accessToken: "acccess",
      refreshToken: "refresh",
    };

    vi.mocked(findOneTokenAndDelete).mockResolvedValue(mockToken);
    vi.mocked(findUserById).mockResolvedValue(mockUser);
    vi.mocked(generateTokens).mockResolvedValue(mockTokens);

    const result = await refreshToken("oldRefreshToken");

    expect(findOneTokenAndDelete).toHaveBeenCalledWith("oldRefreshToken");
    expect(findUserById).toHaveBeenCalledWith(mockToken.user);
    expect(generateTokens).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({
      newAccessToken: "acccess",
      newRefreshToken: "refresh",
    });
  });

  it("should throw UnauthorizedError if refresh token does not exist", async () => {
    vi.mocked(findOneTokenAndDelete).mockResolvedValue(null);

    await expect(refreshToken("invalidToken")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );

    expect(findOneTokenAndDelete).toHaveBeenCalledWith("invalidToken");
    expect(findUserById).not.toHaveBeenCalled();
    expect(generateTokens).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError if user does not exist", async () => {
    const expiresAt = new Date();
    const mockToken = {
      _id: new Types.ObjectId(),
      token: "oldRefreshToken",
      user: new Types.ObjectId(),
      expiresAt: expiresAt.setDate(expiresAt.getDate() + 1),
    } as any;

    vi.mocked(findOneTokenAndDelete).mockResolvedValue(mockToken);
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(refreshToken("oldRefreshToken")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );

    expect(findOneTokenAndDelete).toHaveBeenCalledWith("oldRefreshToken");
    expect(findUserById).toHaveBeenCalledWith(mockToken.user);
    expect(generateTokens).not.toHaveBeenCalled();
  });
});
