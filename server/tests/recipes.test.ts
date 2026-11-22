import { randomUUID } from "node:crypto";

import { createApp } from "@app/app";
import request from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

describe("recipes module", () => {
  it("rejects invalid params and query", async () => {
    await request(app).get("/api/v1/recipes/not-a-uuid").expect(400);
    await request(app).get("/api/v1/recipes?limit=0").expect(400);
  });

  it("returns 404 for a missing recipe", async () => {
    const res = await request(app).get(`/api/v1/recipes/${randomUUID()}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, statusCode: 404 });
  });
});
