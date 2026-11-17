// Contract for /api/v1/examples. The server's Zod schemas are checked against these types.

export interface Example {
  id: string;
  name: string;
  createdAt: string;
}

export interface ListExamplesQuery {
  limit?: number;
}

export interface CreateExampleInput {
  name: string;
}
