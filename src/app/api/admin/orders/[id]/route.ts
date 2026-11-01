import { and, eq } from "drizzle-orm";
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

/** Admin only, and only for orders that are already completed. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const [row] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (row.status !== "completed") return NextResponse.json({ error: "Only completed orders can be deleted." }, { status: 409 });
  await db.delete(orders).where(and(eq(orders.id, id), eq(orders.status, "completed")));
  return NextResponse.json({ ok: true });
}
