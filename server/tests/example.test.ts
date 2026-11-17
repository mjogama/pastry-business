import { createApp } from "@app/app";
import request from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

describe("example module", () => {
  it("creates, fetches and lists an example", async () => {
    const created = await request(app).post("/api/v1/examples").send({ name: "  first  " });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: "first" }); // trimmed by the schema

    const id = created.body.data.id;
    const fetched = await request(app).get(`/api/v1/examples/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const listed = await request(app).get("/api/v1/examples?limit=5");
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
  });

  it("rejects an invalid body with field-level details", async () => {
    const res = await request(app).post("/api/v1/examples").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.details).toEqual([expect.objectContaining({ path: "name" })]);
  });

  it("rejects invalid params and query", async () => {
    await request(app).get("/api/v1/examples/not-a-uuid").expect(400);
    await request(app).get("/api/v1/examples?limit=0").expect(400);
  });

  it("returns 404 for a missing example and 409 for a duplicate name", async () => {
    await request(app).get("/api/v1/examples/3f2b8c1e-5d4a-4b6f-9e7d-1a2b3c4d5e6f").expect(404);

    await request(app).post("/api/v1/examples").send({ name: "dup" }).expect(201);
    await request(app).post("/api/v1/examples").send({ name: "dup" }).expect(409);
  });
});
