import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Cup from "@/components/Cup";
import { RefreshEvery, ReorderButton } from "@/components/Misc";
import { StatChips } from "@/components/Stats";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { fmt, SIZES } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const s = (await getSession())!;
  const [o] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, s.user.id)));
  if (!o) notFound();

  const flow = o.fulfilment === "delivery" ? ["pending", "preparing", "out_for_delivery", "completed"] : ["pending", "preparing", "ready", "completed"];
  const at = flow.indexOf(o.status);

  return (
    <div className="space-y-6">
      <RefreshEvery />
      {placed && <div className="rounded-2xl bg-matcha/20 p-4 font-semibold" role="status">🎉 Order placed! We&apos;re on it.</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl font-bold">{o.number}</h1><p className="opacity-70">{o.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        <ReorderButton items={o.items} />
      </div>

      {o.status === "cancelled" ? <p className="chip bg-berry/20">Cancelled</p> : (
        <ol className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm" aria-label="Order progress">
          {flow.map((st, i) => (
            <li key={st}><div className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full font-bold ${i <= at ? "bg-caramel text-white" : "bg-milk"}`}>{i <= at ? "✓" : i + 1}</div><span className="capitalize">{st.replaceAll("_", " ")}</span></li>
          ))}
        </ol>
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
          {o.fulfilment === "pickup" ? <p>{o.pickupTime ? o.pickupTime.toLocaleTimeString("en-PH", { timeStyle: "short" }) : "ASAP (~15 min)"}</p> : <p>{o.address?.line1}, {o.address?.city}</p>}
          <p>📞 {o.phone}</p>{o.notes && <p>📝 {o.notes}</p>}<p className="mt-1 opacity-70">Cash on {o.fulfilment === "pickup" ? "pickup" : "delivery"}</p></div>
        <div className="card space-y-1 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{fmt(o.subtotalCents)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{fmt(o.deliveryFeeCents)}</span></div><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{fmt(o.totalCents)}</span></div></div>
      </div>
    </div>
  );
}
