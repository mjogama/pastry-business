import { InMemoryExampleRepository } from "@modules/example/example.repository";

import { ExampleService } from "@modules/example/example.service";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import { beforeEach, describe, expect, it } from "vitest";

// Services take their repository in the constructor, so they can be tested without HTTP or a database.
describe("ExampleService", () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService(new InMemoryExampleRepository());
  });

  it("creates and returns an example", async () => {
    const created = await service.create({ name: "first" });

    expect(await service.getById(created.id)).toEqual(created);
    expect(await service.list(10)).toEqual([created]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(service.getById("missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError for a duplicate name", async () => {
    await service.create({ name: "dup" });

    await expect(service.create({ name: "dup" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("respects the list limit", async () => {
    await service.create({ name: "a" });
    await service.create({ name: "b" });

    expect(await service.list(1)).toHaveLength(1);
  });
});
