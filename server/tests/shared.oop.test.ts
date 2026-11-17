import { InMemoryRepository } from "@shared/database/InMemoryRepository";
import { BaseController } from "@shared/http/BaseController";
import { BaseRouter } from "@shared/http/BaseRouter";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

interface Note {
  id: string;
  text: string;
}

describe("InMemoryRepository", () => {
  it("covers create, find, update and delete without any feature code", async () => {
    const repository = new InMemoryRepository<Note>();

    await repository.create({ id: "1", text: "a" });
    await repository.create({ id: "2", text: "b" });

    expect(await repository.findAll({ limit: 1 })).toEqual([{ id: "1", text: "a" }]);
    expect(await repository.findAll({ offset: 1 })).toEqual([{ id: "2", text: "b" }]);
    expect(await repository.update("1", { text: "c" })).toEqual({ id: "1", text: "c" });
    expect(await repository.update("missing", { text: "x" })).toBeNull();
    expect(await repository.delete("1")).toBe(true);
    expect(await repository.findById("1")).toBeNull();
  });
});

describe("BaseController and BaseRouter", () => {
  class NoteController extends BaseController {
    list = (_req: Request, res: Response) => this.ok(res, [], "Notes retrieved");
    create = (_req: Request, res: Response) => this.created(res, { id: "1" });
    remove = (_req: Request, res: Response) => this.noContent(res);
  }

  class NoteRouter extends BaseRouter {
    constructor(controller: NoteController) {
      super();
      this.router.get("/", controller.list);
      this.router.post("/", controller.create);
      this.router.delete("/", controller.remove);
    }
  }

  const app = express().use(new NoteRouter(new NoteController()).router);

  it("sends the standard envelope", async () => {
    const listed = await request(app).get("/");
    expect(listed.body).toEqual({ success: true, statusCode: 200, message: "Notes retrieved", data: [] });

    const created = await request(app).post("/");
    expect(created.status).toBe(201);
    expect(created.body.message).toBe("Created");

    await request(app).delete("/").expect(204);
  });
});
