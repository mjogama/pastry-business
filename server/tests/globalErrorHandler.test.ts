import globalErrorHandler from "@app/middlewares/globalErrorHandler";
import { ForbiddenError } from "@shared/errors/AppError";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const buildApp = (thrower: () => never) => {
  const app = express();
  app.get("/", () => thrower());
  app.use(globalErrorHandler);
  return app;
};

describe("globalErrorHandler", () => {
  it("hides the message of unexpected errors", async () => {
    const app = buildApp(() => {
      throw new Error("connect ECONNREFUSED db-internal:5432");
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
    expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
  });

  it("shows the message of an AppError", async () => {
    const app = buildApp(() => {
      throw new ForbiddenError("Admins only");
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false, status: "Forbidden", message: "Admins only" });
  });

  it("turns a ZodError into a 400 with details", async () => {
    const app = buildApp(() => {
      z.object({ email: z.email() }).parse({ email: "nope" });
      throw new Error("unreachable");
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([expect.objectContaining({ path: "email" })]);
  });

  it("does not crash on a ValidationError without an errors map", async () => {
    const app = buildApp(() => {
      throw Object.assign(new Error("boom"), { name: "ValidationError" });
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(500);
  });
});
