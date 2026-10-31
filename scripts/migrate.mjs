// Applies SQL migrations in ./drizzle to Neon. Runs automatically on Vercel via `vercel-build`.
// Safe to re-run (drizzle tracks applied migrations). Skips quietly if no DB is configured.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.warn("[migrate] No DATABASE_URL set - skipping migrations.");
  process.exit(0);
}

try {
  await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Database is up to date.");
} catch (err) {
  console.error("[migrate] Migration failed:", err);
  process.exit(1);
}
