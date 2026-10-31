import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { fmt } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata = { title: "My Orders" };
const statusStyle: Record<string, string> = { pending: "bg-caramel/20", preparing: "bg-caramel/30", ready: "bg-matcha/30", out_for_delivery: "bg-matcha/30", completed: "bg-milk", cancelled: "bg-berry/20" };

export default async function Orders() {
  const s = (await getSession())!;
  const rows = await db.select().from(orders).where(eq(orders.userId, s.user.id)).orderBy(desc(orders.createdAt));
  return (
    <>
      <h1 className="mb-5 text-4xl font-bold">My orders</h1>
      {rows.length === 0 ? (
        <div className="card py-12 text-center"><div className="text-5xl">📦</div><p className="my-3">No orders yet.</p><Link href="/build" className="btn-accent">Build my first coffee</Link></div>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card flex items-center justify-between gap-3 transition hover:-translate-y-0.5">
                <div><div className="font-bold">{o.number}</div><div className="text-sm opacity-70">{o.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium" })} · {o.items.reduce((a, i) => a + i.qty, 0)} drink(s) · {o.fulfilment}</div></div>
                <div className="text-right"><div className="font-bold">{fmt(o.totalCents)}</div><span className={`chip capitalize ${statusStyle[o.status]}`}>{o.status.replaceAll("_", " ")}</span></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
