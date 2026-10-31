import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { keySource } from "@/lib/crypto";
import { db } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Visit /api/health to see which part of the setup is missing. Never returns secret values.
export async function GET() {
  const checks = {
    secretSet: !!process.env.BETTER_AUTH_SECRET,
    databaseUrlSet: !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
    databaseReachable: false,
    tablesExist: false,
    encryptionKey: keySource(), // "dedicated" is best; "derived" works but set DATA_ENCRYPTION_KEY
    emailConfigured: mailConfigured(), // needed to send OTP codes in production
  };
  try {
    await db.execute(sql`select 1`);
    checks.databaseReachable = true;
    await db.execute(sql`select 1 from "user" limit 1`);
    await db.execute(sql`select 1 from "orders" limit 1`);
    checks.tablesExist = true;
  } catch { /* leave flags false */ }
  const ok = checks.secretSet && checks.databaseReachable && checks.tablesExist && checks.emailConfigured && checks.encryptionKey !== "missing";
  return NextResponse.json({ ok, ...checks }, { status: ok ? 200 : 503 });
}
