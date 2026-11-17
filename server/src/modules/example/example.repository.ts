import type { Example } from "./example.schema";

/** What the service needs from storage. A database-backed class only has to implement this. */
export interface ExampleRepository {
  findAll(limit: number): Promise<Example[]>;
  findById(id: string): Promise<Example | null>;
  findByName(name: string): Promise<Example | null>;
  create(example: Example): Promise<Example>;
}

export class InMemoryExampleRepository implements ExampleRepository {
  private readonly items = new Map<string, Example>();

  async findAll(limit: number): Promise<Example[]> {
    return [...this.items.values()].slice(0, limit);
  }

  async findById(id: string): Promise<Example | null> {
    return this.items.get(id) ?? null;
  }

  async findByName(name: string): Promise<Example | null> {
    return [...this.items.values()].find((example) => example.name === name) ?? null;
  }

  async create(example: Example): Promise<Example> {
    this.items.set(example.id, example);
    return example;
  }
}
