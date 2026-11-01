import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { DELIVERY_FEE_CENTS, MIN_PREP_MINUTES, OrderItem, calcStats, unitPrice, validateConfig } from "@/lib/catalog";
import { getSession } from "@/lib/session";

const config = z.object({
  base: z.string(),
  size: z.enum(["s", "m", "l"]),
  temp: z.enum(["hot", "iced", "blended"]),
  shots: z.number(),
  matcha: z.number(),
  milk: z.string(),
  syrups: z.record(z.string(), z.number()),
  toppings: z.array(z.string()).max(20),
});

const body = z.object({
  fulfilment: z.enum(["pickup", "delivery"]),
  phone: z.string().trim().min(7).max(25),
  notes: z.string().max(300).optional(),
  pickupTime: z.string().datetime().nullable().optional(),
  address: z.object({ line1: z.string().trim().min(3).max(120), city: z.string().trim().min(2).max(60) }).optional(),
  items: z.array(z.object({ name: z.string().trim().min(1).max(40), qty: z.number().int().min(1).max(20), config })).min(1).max(30),
});

const orderNumber = () => "BYO-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your order details." }, { status: 400 });
  const b = parsed.data;
  if (b.fulfilment === "delivery" && !b.address) return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });

  if (b.fulfilment === "pickup" && b.pickupTime && new Date(b.pickupTime).getTime() < Date.now() + (MIN_PREP_MINUTES - 1) * 60000)
    return NextResponse.json({ error: `Pickup must be at least ${MIN_PREP_MINUTES} minutes from now. Please choose a later time.` }, { status: 400 });

  // Never trust client prices: re-validate and re-price every drink on the server.
  const items: OrderItem[] = [];
  for (const i of b.items) {
    const err = validateConfig(i.config);
    if (err) return NextResponse.json({ error: `${i.name}: ${err}` }, { status: 400 });
    items.push({ name: i.name, qty: i.qty, config: i.config, unitCents: unitPrice(i.config), stats: calcStats(i.config) });
  }
  const subtotal = items.reduce((a, i) => a + i.unitCents * i.qty, 0);
  const fee = b.fulfilment === "delivery" ? DELIVERY_FEE_CENTS : 0;

  const [row] = await db.insert(orders).values({
    number: orderNumber(),
    userId: session.user.id,
    fulfilment: b.fulfilment,
    pickupTime: b.pickupTime ? new Date(b.pickupTime) : null,
    address: b.fulfilment === "delivery" ? b.address! : null,
    phone: b.phone,
    notes: b.notes ?? null,
    items,
    subtotalCents: subtotal,
    deliveryFeeCents: fee,
    totalCents: subtotal + fee,
  }).returning({ id: orders.id });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
