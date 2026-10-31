"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Cup from "./Cup";
import { StatChips } from "./Stats";
import { calcStats, fmt, unitPrice, BASE_MAP, MILK_MAP, SIZES } from "@/lib/catalog";
import { useHydrated } from "@/lib/hydrated";
import { useBuilder, useCart } from "@/lib/store";

export default function CartView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, setQty, remove, duplicate } = useCart();
  const loadItem = useBuilder((s) => s.loadItem);
  const [ok, setOk] = useState(false);

  if (!hydrated) return <div className="card h-40 animate-pulse" />;
  if (items.length === 0)
    return (
      <div className="card py-12 text-center"><div className="text-5xl">🛒</div><h2 className="mt-2 text-2xl font-bold">Your basket is empty</h2>
        <p className="mb-5 opacity-70">Time to build something delicious.</p>
        <div className="flex justify-center gap-2"><Link href="/build" className="btn-accent">Build my coffee</Link><Link href="/menu" className="btn-ghost">Browse menu</Link></div></div>
    );

  const subtotal = items.reduce((a, i) => a + unitPrice(i.config) * i.qty, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {items.map((i) => {
          const s = calcStats(i.config);
          return (
            <li key={i.id} className="card flex gap-4">
              <div className="grid w-24 shrink-0 place-items-center rounded-xl bg-milk/60 sm:w-32"><Cup config={i.config} className="h-28 sm:h-36" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2"><h3 className="truncate text-lg font-bold">{i.name}</h3><span className="font-bold">{fmt(unitPrice(i.config) * i.qty)}</span></div>
                <p className="mb-2 text-sm opacity-70">{SIZES[i.config.size].label} · {i.config.temp} · {BASE_MAP[i.config.base].name}{i.config.milk !== "none" ? ` · ${MILK_MAP[i.config.milk].name} milk` : ""}</p>
                <StatChips s={s} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <div className="flex items-center rounded-full bg-milk">
                    <button className="h-9 w-9" aria-label="Decrease quantity" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                    <span className="w-6 text-center font-bold">{i.qty}</span>
                    <button className="h-9 w-9" aria-label="Increase quantity" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                  </div>
                  <button className="underline" onClick={() => { loadItem(i); router.push("/build"); }}>Edit</button>
                  <button className="underline" onClick={() => duplicate(i.id)}>Duplicate</button>
                  <button className="text-berry underline" onClick={() => remove(i.id)}>Remove</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="card h-fit lg:sticky lg:top-20">
        <h2 className="text-xl font-bold">Summary</h2>
        <div className="my-3 flex justify-between"><span>Subtotal</span><span className="font-bold">{fmt(subtotal)}</span></div>
        <label className="mb-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={ok} onChange={(e) => setOk(e.target.checked)} />I&apos;ve reviewed my drinks and they&apos;re just right.</label>
        <button className="btn-primary w-full" disabled={!ok} onClick={() => router.push("/checkout")}>Checkout</button>
        <Link href="/build" className="btn-ghost mt-2 w-full">+ Build another</Link>
      </aside>
    </div>
  );
}
