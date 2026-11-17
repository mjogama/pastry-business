import { z } from "zod";

import type { CreateExampleInput, Example, ListExamplesQuery } from "@common/modules/example";

export type { CreateExampleInput, Example } from "@common/modules/example";

export const exampleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
}) satisfies z.ZodType<Example>;

export const listExamplesSchemas = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }) satisfies z.ZodType<Required<ListExamplesQuery>>,
};

export const getExampleSchemas = {
  params: z.object({ id: z.uuid() }),
};

export const createExampleSchemas = {
  body: z.object({
    name: z.string().trim().min(1).max(100),
  }) satisfies z.ZodType<CreateExampleInput>,
};
