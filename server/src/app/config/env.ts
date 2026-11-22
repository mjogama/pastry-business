import "dotenv/config";
import { z } from "zod";

const trustProxy = z
  .string()
  .default("false")
  .transform((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    const hops = Number(value);
    return Number.isInteger(hops) && hops >= 0 ? hops : value;
  });

const originList = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8001),
  DATABASE_URL: z.string().min(1),
  BASE_URL: originList,
  TRUST_PROXY: trustProxy,
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  BODY_LIMIT: z.string().min(1).default("100kb"),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env: Env = parsed.data;
