import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Fallback keeps `next build` from crashing when no DB is configured; queries only run at request time.
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://user:pass@localhost/db";
export const db = drizzle(neon(url), { schema });
export { schema };
