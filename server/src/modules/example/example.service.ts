import { randomUUID } from "node:crypto";

import type { ExampleRepository } from "./example.repository";
import type { CreateExampleInput, Example } from "./example.schema";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";

/** Business rules only: no req/res, no storage details. */
export class ExampleService {
  constructor(private readonly repository: ExampleRepository) {}

  list(limit: number): Promise<Example[]> {
    return this.repository.findAll(limit);
  }

  async getById(id: string): Promise<Example> {
    const example = await this.repository.findById(id);
    if (!example) throw new NotFoundError(`Example ${id} not found`);
    return example;
  }

  async create(input: CreateExampleInput): Promise<Example> {
    const duplicate = await this.repository.findByName(input.name);
    if (duplicate) throw new ConflictError(`An example named "${input.name}" already exists`);

    return this.repository.create({ id: randomUUID(), name: input.name, createdAt: new Date().toISOString() });
  }
}
