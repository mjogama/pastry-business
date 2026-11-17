import { createApp } from "@app/app";
import { env } from "@app/config/env";
import request from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

describe("health", () => {
  it("GET /health responds 200", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, statusCode: 200 });
  });

  it("GET /ready responds 200 when no checks are registered", async () => {
    const res = await request(app).get("/ready");

    expect(res.status).toBe(200);
  });
});

describe("routing", () => {
  it("GET /api/v1/status uses the success envelope", async () => {
    const res = await request(app).get("/api/v1/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, statusCode: 200, message: "API v1 is running", data: null });
  });

  it("unknown routes use the error envelope", async () => {
    const res = await request(app).get("/nope");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 404,
      status: "Not Found",
      message: "Route not found: GET /nope",
    });
  });

  it("returns a request id header and echoes it in errors", async () => {
    const res = await request(app).get("/nope").set("X-Request-Id", "abc-123");

    expect(res.headers["x-request-id"]).toBe("abc-123");
    expect(res.body.requestId).toBe("abc-123");
  });

  it("malformed JSON is a 400, not a 500", async () => {
    const res = await request(app).post("/api/v1/examples").set("Content-Type", "application/json").send("{bad");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("rate limiting", () => {
  it("answers 429 in the error envelope and never limits /health", async () => {
    const limited = createApp({ ...env, RATE_LIMIT_MAX: 1 });

    await request(limited).get("/api/v1/status").expect(200);
    const res = await request(limited).get("/api/v1/status");

    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({ success: false, statusCode: 429, status: "Too Many Requests" });
    await request(limited).get("/health").expect(200);
  });
});
