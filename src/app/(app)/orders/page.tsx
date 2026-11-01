import { and, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import OrderProgress from "@/components/OrderProgress";
import { HideOrderButton, RefreshEvery } from "@/components/Misc";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { fmt } from "@/lib/catalog";
import { STATUS_LABEL } from "@/lib/order-flow";
import { getSession } from "@/lib/session";

export const metadata = { title: "My Orders" };
const statusStyle: Record<string, string> = { pending: "bg-caramel/20", preparing: "bg-caramel/30", ready: "bg-matcha/30", out_for_delivery: "bg-matcha/30", completed: "bg-milk", cancelled: "bg-berry/20" };

export default async function Orders() {
  const s = (await getSession())!;
  const rows = await db.select().from(orders).where(and(eq(orders.userId, s.user.id), isNull(orders.hiddenAt))).orderBy(desc(orders.createdAt));
  return (
    <>
      <RefreshEvery />
      <h1 className="mb-5 text-4xl font-bold">My orders</h1>
      {rows.length === 0 ? (
        <div className="card py-12 text-center"><div className="text-5xl">📦</div><p className="my-3">No orders yet.</p><Link href="/build" className="btn-accent">Build my first coffee</Link></div>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id} className="card transition hover:-translate-y-0.5">
              <Link href={`/orders/${o.id}`} className="block">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="font-bold">{o.number}</div><div className="text-sm opacity-70">{o.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })} · {o.items.reduce((a, i) => a + i.qty, 0)} drink(s) · {o.fulfilment}</div></div>
                  <div className="text-right"><div className="font-bold">{fmt(o.totalCents)}</div><span className={`chip ${statusStyle[o.status]}`}>{STATUS_LABEL[o.status] ?? o.status}</span></div>
                </div>
                {o.status !== "cancelled" && <div className="mt-4 px-1"><OrderProgress fulfilment={o.fulfilment} status={o.status} compact /></div>}
              </Link>
              {(o.status === "completed" || o.status === "cancelled") && <div className="mt-3 flex justify-end border-t border-espresso/10 pt-3"><HideOrderButton id={o.id} number={o.number} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
