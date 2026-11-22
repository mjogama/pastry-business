import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Prisma CLI (migrate, studio) needs a direct connection: Neon's pooled one (PgBouncer) breaks
  // migrations. The app itself keeps using the pooled DATABASE_URL (src/app/config/db.ts).
  // Without DATABASE_URL_UNPOOLED (local Postgres), DATABASE_URL is already direct.
  // `prisma generate` needs no database, so a missing URL is allowed here (Docker builds have none);
  // migrate fails with a clear connection error instead.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "" },
});
