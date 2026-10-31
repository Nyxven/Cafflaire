import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StatusSelect } from "@/components/Misc";
import { RefreshEvery } from "@/components/Misc";
import { db } from "@/lib/db";
import { ORDER_STATUSES, orders } from "@/lib/db/schema";
import { fmt } from "@/lib/catalog";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Admin" };

export default async function Admin() {
  const s = await getSession();
  if (!s || !isAdmin(s.user.email)) notFound();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
  return (
    <>
      <RefreshEvery ms={20000} />
      <h1 className="mb-5 text-4xl font-bold">Orders</h1>
      <div className="overflow-x-auto"><table className="card w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-espresso/10"><th className="p-2">Order</th><th>Drinks</th><th>Type</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>{rows.map((o) => (
          <tr key={o.id} className="border-b border-espresso/5 align-top">
            <td className="p-2 font-semibold">{o.number}<div className="text-xs font-normal opacity-60">{o.phone}</div></td>
            <td>{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</td>
            <td className="capitalize">{o.fulfilment}{o.address ? <div className="text-xs opacity-60">{o.address.line1}, {o.address.city}</div> : null}</td>
            <td>{fmt(o.totalCents)}</td>
            <td><StatusSelect id={o.id} status={o.status} options={ORDER_STATUSES} /></td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
}
