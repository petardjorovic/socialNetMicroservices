import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
  },
}));

vi.mock("../../../src/services/user.service.js", () => ({
  logoutUser: vi.fn(),
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

import { logoutUser } from "../../../src/services/user.service.js";
import { userLogout } from "../../../src/controllers/identity.controller.js";
import logger from "../../../src/utils/logger.js";

describe("userLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 if logout is successfull", async () => {
    const req: any = {
      body: {
        refreshToken: "refreshToken",
      },
    };

    const res = mockResponse();

    await userLogout(req, res);

    expect(logger.info).toHaveBeenCalledWith("User logout endpoint hit...");
    expect(logoutUser).toHaveBeenCalledWith(req.body.refreshToken);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User logged out successfully",
    });
  });

  it("should throw error if logoutUser fails", async () => {
    const req: any = {
      body: {
        refreshToken: "refreshToken",
      },
    };

    const res = mockResponse();

    vi.mocked(logoutUser).mockRejectedValue(new Error("Logout failed"));

    await expect(userLogout(req, res)).rejects.toThrow("Logout failed");

    expect(logger.info).toHaveBeenCalledWith("User logout endpoint hit...");
    expect(logoutUser).toHaveBeenCalledWith(req.body.refreshToken);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
