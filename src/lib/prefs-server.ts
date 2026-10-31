import { eq } from "drizzle-orm";
import { db } from "./db";
import { userPrefs } from "./db/schema";
import { Prefs, normalize, prefsSchema } from "./prefs";

export type PrefsState = { status: "none" } | { status: "skipped" } | { status: "completed"; prefs: Prefs };

/** Reads a person's onboarding state. Never throws: if the table isn't ready yet, they just see no personalisation. */
export async function getPrefsState(userId: string): Promise<PrefsState> {
  try {
    const [row] = await db.select().from(userPrefs).where(eq(userPrefs.userId, userId)).limit(1);
    if (!row) return { status: "none" };
    if (row.status === "skipped" || !row.data) return { status: "skipped" };
    const parsed = prefsSchema.safeParse(row.data);
    return parsed.success ? { status: "completed", prefs: normalize(parsed.data) } : { status: "skipped" };
  } catch (err) {
    console.error("[prefs] read failed", err instanceof Error ? err.message : err);
    return { status: "skipped" };
  }
}
