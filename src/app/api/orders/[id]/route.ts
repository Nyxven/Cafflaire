import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

/**
 * A customer removes one of THEIR OWN orders from "My orders".
 * Only finished orders (completed or cancelled) can be removed, never one that is still being made.
 * The row is hidden, not erased, so the shop keeps its records and the customer keeps their EXP and badges.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const mine = and(eq(orders.id, id), eq(orders.userId, session.user.id), isNull(orders.hiddenAt));
  const [row] = await db.select({ status: orders.status }).from(orders).where(mine);
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (row.status !== "completed" && row.status !== "cancelled") return NextResponse.json({ error: "You can remove an order once it is completed or cancelled." }, { status: 409 });

  // Re-check the status inside the update, in case the admin changed it between the two queries.
  await db.update(orders).set({ hiddenAt: new Date() }).where(and(mine, inArray(orders.status, ["completed", "cancelled"])));
  return NextResponse.json({ ok: true });
}
