export interface Entity {
  id: string;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
}

export interface Repository<T extends Entity> {
  findAll(options?: FindAllOptions): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(entity: T): Promise<T>;
  update(id: string, changes: Partial<Omit<T, "id">>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
