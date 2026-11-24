import { z } from "zod";

import type { LoginInput } from "@common/modules/auth";

export type { AuthUser, LoginInput } from "@common/modules/auth";

export const loginBodySchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
}) satisfies z.ZodType<LoginInput>;

export const loginSchemas = { body: loginBodySchema };
