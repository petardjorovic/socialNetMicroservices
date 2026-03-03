import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/repositories/refresh-token.repository.js", () => ({
  deleteOneToken: vi.fn(),
}));

vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
  },
}));

import { deleteOneToken } from "../../../src/repositories/refresh-token.repository.js";
import { logoutUser } from "../../../src/services/user.service.js";
import logger from "../../../src/utils/logger.js";

describe("logoutUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should logout user if refresh token is valid", async () => {
    const result = await logoutUser("refreshToken");

    expect(deleteOneToken).toHaveBeenCalledOnce();
    expect(deleteOneToken).toHaveBeenCalledWith("refreshToken");
    expect(logger.info).toHaveBeenCalledWith(
      "Refresh token deleted for logout",
    );
  });

  it("should propagate error if deleteOneToken fail", async () => {
    vi.mocked(deleteOneToken).mockRejectedValue(new Error("DB error"));

    await expect(logoutUser("refreshToken")).rejects.toThrow("DB error");

    expect(logger.info).not.toHaveBeenCalled();
  });
});
