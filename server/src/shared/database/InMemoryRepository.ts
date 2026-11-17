import type { Entity, FindAllOptions, Repository } from "./Repository";

export class InMemoryRepository<T extends Entity> implements Repository<T> {
  protected readonly items = new Map<string, T>();

  async findAll({ limit, offset = 0 }: FindAllOptions = {}): Promise<T[]> {
    const all = [...this.items.values()];
    return all.slice(offset, limit === undefined ? undefined : offset + limit);
  }

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async create(entity: T): Promise<T> {
    this.items.set(entity.id, entity);
    return entity;
  }

  async update(id: string, changes: Partial<Omit<T, "id">>): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...changes };
    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
