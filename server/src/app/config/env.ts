import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // NODE_ENV: z.enum(["production", "development"]),
  PORT: z.coerce.number(),
  DB_URI: z.string(),
  BASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
