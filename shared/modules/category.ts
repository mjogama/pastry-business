export interface Category {
  id: string;
  /** Unique. */
  name: string; // unique
  sortOrder: number;
}

export interface ListCategoriesQuery {
  limit?: number;
}

export interface CreateCategoryInput {
  name: string;
  /** Defaults to the end of the list. */
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
