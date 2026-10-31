import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ORDER_STATUSES, orders } from "@/lib/db/schema";
import { getSession, isAdmin } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = z.object({ status: z.enum(ORDER_STATUSES) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
