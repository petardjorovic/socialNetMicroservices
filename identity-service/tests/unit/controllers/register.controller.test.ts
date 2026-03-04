import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
  },
}));

vi.mock("../../../src/services/user.service.js", () => ({
  registerUser: vi.fn(),
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

import { registerUser } from "../../../src/services/user.service.js";
import { userRegistration } from "../../../src/controllers/identity.controller.js";
import logger from "../../../src/utils/logger.js";

describe("userRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 and tokens if user is successfully registered", async () => {
    const req: any = {
      body: {
        email: "test@test.com",
        username: "test",
        password: "123456",
      },
    };

    const mockTokens = {
      accessToken: "access",
      refreshToken: "refresh",
    };

    const res = mockResponse();

    vi.mocked(registerUser).mockResolvedValue(mockTokens);

    await userRegistration(req, res);

    expect(logger.info).toHaveBeenCalledWith(
      "User Registration endpoint hit...",
    );
    expect(registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User registered successfully",
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
    });
  });

  it("should throw error if registerUser fails", async () => {
    const req: any = {
      body: {
        email: "test@test.com",
        username: "test",
        password: "123456",
      },
    };

    const res = mockResponse();

    vi.mocked(registerUser).mockRejectedValue(new Error("User already exists"));

    await expect(userRegistration(req, res)).rejects.toThrow(
      "User already exists",
    );
    expect(logger.info).toHaveBeenCalled();
    expect(registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
