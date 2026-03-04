import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
  },
}));

vi.mock("../../../src/services/user.service.js", () => ({
  loginUser: vi.fn(),
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

import logger from "../../../src/utils/logger.js";
import { loginUser } from "../../../src/services/user.service.js";
import { userLogin } from "../../../src/controllers/identity.controller.js";

describe("userLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and tokens if login is successfully", async () => {
    const req: any = {
      body: {
        email: "test@test.com",
        password: "123456",
      },
    };

    const res = mockResponse();

    const mockTokens = {
      accessToken: "access",
      refreshToken: "refresh",
    };

    vi.mocked(loginUser).mockResolvedValue(mockTokens);

    await userLogin(req, res);

    expect(logger.info).toHaveBeenCalledWith("User Login endpoint hit...");
    expect(loginUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User logged in successfully",
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
    });
  });

  it("should throw error if loginUser fails", async () => {
    const req: any = {
      body: {
        email: "test@test.com",
        password: "123456",
      },
    };

    const res = mockResponse();

    vi.mocked(loginUser).mockRejectedValue(new Error("Invalid credentials"));

    await expect(userLogin(req, res)).rejects.toThrow("Invalid credentials");

    expect(logger.info).toHaveBeenCalledWith("User Login endpoint hit...");
    expect(loginUser).toHaveBeenCalledWith(req.body);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
