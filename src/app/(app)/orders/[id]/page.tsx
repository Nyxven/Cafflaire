import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Cup from "@/components/Cup";
import { RefreshEvery, ReorderButton } from "@/components/Misc";
import OrderProgress from "@/components/OrderProgress";
import Receipt, { ReceiptData } from "@/components/Receipt";
import { StatChips } from "@/components/Stats";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { fmt, SIZES, STORE } from "@/lib/catalog";
import { describeIngredients, describeSize } from "@/lib/brew";
import { STATUS_HINT } from "@/lib/order-flow";
import { getSession } from "@/lib/session";

export const metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const s = (await getSession())!;
  const [o] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, s.user.id)));
  if (!o) notFound();

  const receipt: ReceiptData = {
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    fulfilment: o.fulfilment,
    pickupTime: o.pickupTime ? o.pickupTime.toISOString() : null,
    city: o.address?.city ?? null,
    items: o.items.map((i) => ({ qty: i.qty, name: i.name, unitCents: i.unitCents, size: describeSize(i.config), details: describeIngredients(i.config) })),
    subtotalCents: o.subtotalCents,
    deliveryFeeCents: o.deliveryFeeCents,
    totalCents: o.totalCents,
  };
  const receiptCard = o.status === "cancelled" ? null : <Receipt data={receipt} />;

  return (
    <div className="space-y-6">
      <RefreshEvery />
      {placed && <div className="rounded-2xl bg-matcha/20 p-4 font-semibold" role="status">🎉 Order placed! We&apos;re on it. <a href="#receipt" className="underline">View your receipt ↓</a></div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl font-bold">{o.number}</h1><p className="opacity-70">{o.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" })}</p></div>
        <ReorderButton items={o.items} />
      </div>

      {o.status === "cancelled" ? <p className="chip bg-berry/20">Cancelled</p> : (
        <div className="card space-y-4">
          <OrderProgress fulfilment={o.fulfilment} status={o.status} />
          <p className="text-center text-sm font-semibold" role="status">{STATUS_HINT[o.status]}</p>
        </div>
      )}

      <ul className="space-y-3">
        {o.items.map((i, k) => (
          <li key={k} className="card flex gap-4">
            <div className="grid w-24 shrink-0 place-items-center rounded-xl bg-milk/60"><Cup config={i.config} className="h-28" /></div>
            <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="truncate font-bold">{i.qty}× {i.name}</h3><span className="font-bold">{fmt(i.unitCents * i.qty)}</span></div>
              <p className="mb-2 text-sm opacity-70">{SIZES[i.config.size].label} · {i.config.temp}</p><StatChips s={i.stats} /></div>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card text-sm"><h2 className="mb-1 text-lg font-bold capitalize">{o.fulfilment}</h2>
          {o.fulfilment === "pickup" ? <><p>{o.pickupTime ? o.pickupTime.toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" }) : "ASAP"}</p>{STORE.pickupAddress && <p>📍 {STORE.pickupAddress}</p>}</> : <p>{o.address?.line1}, {o.address?.city}</p>}
          <p>📞 {o.phone}</p>{o.notes && <p>📝 {o.notes}</p>}<p className="mt-1 opacity-70">Cash on {o.fulfilment === "pickup" ? "pickup" : "delivery"}</p></div>
        <div className="card space-y-1 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{fmt(o.subtotalCents)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{fmt(o.deliveryFeeCents)}</span></div><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{fmt(o.totalCents)}</span></div></div>
      </div>
      {receiptCard}
    </div>
  );
}
