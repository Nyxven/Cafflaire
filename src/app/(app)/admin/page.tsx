import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Cup from "@/components/Cup";
import { DeleteOrderButton, RefreshEvery, StatusSelect } from "@/components/Misc";
import { db } from "@/lib/db";
import { ORDER_STATUSES, orders } from "@/lib/db/schema";
import { BASE_MAP, fmt } from "@/lib/catalog";
import { describeIngredients, describeSize } from "@/lib/brew";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Admin" };

type Row = typeof orders.$inferSelect;
const MANILA = "Asia/Manila";
const stamp = (d: Date) => d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: MANILA });

function OrderCard({ o }: { o: Row }) {
  const finished = o.status === "completed";
  const drinks = o.items.reduce((a, i) => a + i.qty, 0);
  return (
    <article className="card space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{o.number}</h3>
          <p className="text-sm opacity-70">{stamp(o.createdAt)} · {drinks} drink{drinks === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold">{fmt(o.totalCents)}</span>
          <StatusSelect id={o.id} status={o.status} options={ORDER_STATUSES} />
        </div>
      </header>

      <ul className="space-y-3">
        {o.items.map((i, k) => (
          <li key={k} className="flex gap-3 rounded-2xl bg-milk/50 p-3">
            <div className="grid w-14 shrink-0 place-items-center"><Cup config={i.config} className="h-20" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <p className="font-bold">{i.qty}× {i.name}</p>
                <span className="shrink-0 text-sm font-semibold">{fmt(i.unitCents * i.qty)}</span>
              </div>
              <p className="text-sm opacity-70">{BASE_MAP[i.config.base]?.name ?? "Custom"} · {describeSize(i.config)}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {describeIngredients(i.config).map((t) => <li key={t} className="chip bg-surface">{t}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold capitalize">{o.fulfilment}</p>
          {o.fulfilment === "pickup"
            ? <p className="opacity-80">Pickup: {o.pickupTime ? o.pickupTime.toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: MANILA }) : "ASAP"}</p>
            : <p className="opacity-80">📍 {o.address?.line1}, {o.address?.city}</p>}
          <p className="opacity-80">📞 {o.phone}</p>
        </div>
        {o.notes && <p className="rounded-xl bg-caramel/15 p-2"><span className="font-semibold">📝 Notes:</span> {o.notes}</p>}
      </div>

      {finished && (
        <footer className="border-t border-espresso/10 pt-3"><DeleteOrderButton id={o.id} number={o.number} /></footer>
      )}
    </article>
  );
}

export default async function Admin() {
  const s = await getSession();
  if (!s || !isAdmin(s.user.email)) notFound();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  const active = rows.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const past = rows.filter((o) => o.status === "completed" || o.status === "cancelled");
  return (
    <>
      <RefreshEvery ms={20000} />
      <h1 className="mb-5 text-4xl font-bold">Orders</h1>

      <h2 className="mb-3 text-2xl font-bold">Active ({active.length})</h2>
      {active.length === 0
        ? <p className="card mb-8 text-center opacity-70">No active orders right now. ☕</p>
        : <div className="mb-8 space-y-4">{active.map((o) => <OrderCard key={o.id} o={o} />)}</div>}

      <h2 className="mb-1 text-2xl font-bold">Completed &amp; cancelled ({past.length})</h2>
      <p className="mb-3 text-sm opacity-70">You can delete an order once it is completed.</p>
      {past.length === 0
        ? <p className="card text-center opacity-70">Nothing here yet.</p>
        : <div className="space-y-4">{past.map((o) => <OrderCard key={o.id} o={o} />)}</div>}
    </>
  );
}
