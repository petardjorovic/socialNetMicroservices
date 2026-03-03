import { describe, vi, beforeEach, it, expect } from "vitest";

vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(),
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/refresh-token.repository.js", () => ({
  createToken: vi.fn(),
}));

vi.mock("../../../src/utils/env.js", () => ({
  JWT_SECRET: "test-secret",
}));

import { Types } from "mongoose";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateTokens } from "../../../src/utils/generateToken.js";
import { createToken } from "../../../src/repositories/refresh-token.repository.js";

describe("generateTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate access and refresh token and save refresh token", async () => {
    const mockUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "123456",
    } as any;

    vi.mocked(jwt.sign as any).mockReturnValue("mockAccessToken");

    vi.mocked(crypto.randomBytes).mockReturnValue({
      toString: () => "mockRefreshToken",
    } as any);

    const result = await generateTokens(mockUser);

    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: mockUser._id, username: "test" },
      "test-secret",
      { expiresIn: "60m" },
    );

    expect(createToken).toHaveBeenCalledOnce();
    expect(createToken).toHaveBeenCalledWith(
      "mockRefreshToken",
      mockUser._id,
      expect.any(Date),
    );
    expect(result).toEqual({
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("should propagate error if createToken fail", async () => {
    const mockUser = {
      _id: new Types.ObjectId(),
      username: "test",
      email: "test@test.com",
      password: "123456",
    } as any;

    vi.mocked(jwt.sign as any).mockReturnValue("mockAccessToken");

    vi.mocked(crypto.randomBytes).mockReturnValue({
      toString: () => "mockRefreshToken",
    } as any);

    vi.mocked(createToken).mockRejectedValue("DB error");

    await expect(generateTokens(mockUser)).rejects.toThrow("DB error");
  });
});
