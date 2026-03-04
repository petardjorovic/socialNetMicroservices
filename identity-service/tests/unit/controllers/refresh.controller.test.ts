import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
  },
}));

vi.mock("../../../src/services/user.service.js", () => ({
  refreshToken: vi.fn(),
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

import { refreshToken } from "../../../src/services/user.service.js";
import { userRefreshToken } from "../../../src/controllers/identity.controller.js";
import logger from "../../../src/utils/logger.js";

describe("userRefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and new tokens if they is refreshed successfully", async () => {
    const req: any = {
      body: {
        refreshToken: "refreshToken",
      },
    };

    const mockTokens = {
      newAccessToken: "access",
      newRefreshToken: "refresh",
    };

    const res = mockResponse();

    vi.mocked(refreshToken).mockResolvedValue(mockTokens);

    await userRefreshToken(req, res);

    expect(logger.info).toHaveBeenCalledWith(
      "User refresh token endpoint hit...",
    );
    expect(refreshToken).toHaveBeenCalledWith(req.body.refreshToken);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      accessToken: mockTokens.newAccessToken,
      refreshToken: mockTokens.newRefreshToken,
    });
  });

  it("should throw error if refreshToken fails", async () => {
    const req: any = {
      body: {
        refreshToken: "refreshToken",
      },
    };

    const res = mockResponse();

    vi.mocked(refreshToken).mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    await expect(userRefreshToken(req, res)).rejects.toThrow(
      "Invalid or expired refresh token",
    );

    expect(logger.info).toHaveBeenCalledWith(
      "User refresh token endpoint hit...",
    );
    expect(refreshToken).toHaveBeenCalledWith(req.body.refreshToken);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
