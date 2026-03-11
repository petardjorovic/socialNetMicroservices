import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { createMockService } from "../helpers/mockService.js";

let server: ReturnType<typeof app.listen> | undefined;

beforeAll(() => {
  const mock = createMockService(5001);
  server = mock.server;
});

afterAll(() => {
  server?.close();
});

describe("proxy routing", () => {
  it("should proxy request to idenity-service", async () => {
    const res = await request(app).get("/v1/auth/test");

    expect(res.status).toBe(200);
    expect(res.body.service).toBe("ok");
    expect(res.body.requestId).toBeDefined();
  });
});
