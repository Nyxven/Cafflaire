import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { userPrefs } from "@/lib/db/schema";
import { normalize, prefsSchema } from "@/lib/prefs";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

const body = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), prefs: prefsSchema }),
  z.object({ status: z.literal("skipped") }),
]);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  return NextResponse.json(await getPrefsState(session.user.id));
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your answers and try again." }, { status: 400 });

  const userId = session.user.id;
  try {
    if (parsed.data.status === "skipped") {
      // Skipping never erases answers someone already gave.
      await db.insert(userPrefs).values({ userId, status: "skipped", data: null }).onConflictDoNothing();
    } else {
      const data = normalize(parsed.data.prefs);
      await db.insert(userPrefs).values({ userId, status: "completed", data })
        .onConflictDoUpdate({ target: userPrefs.userId, set: { status: "completed", data, updatedAt: new Date() } });
    }
  } catch (err) {
    console.error("[prefs] save failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't save your answers. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
