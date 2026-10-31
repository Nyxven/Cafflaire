"use client";
import Link from "next/link";
import { useState } from "react";
import Cup from "./Cup";
import { StatChips } from "./Stats";
import { Preset, calcStats, fmt, unitPrice } from "@/lib/catalog";
import { useCart } from "@/lib/store";

export default function PresetCard({ p }: { p: Preset }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  return (
    <article className="card flex flex-col">
      <div className="grid place-items-center rounded-xl bg-milk/60 py-3"><Cup config={p.config} className="h-40" /></div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-tight">{p.name}</h3>
        <span className="font-bold">{fmt(unitPrice(p.config))}</span>
      </div>
      <p className="mb-2 text-sm opacity-70">{p.desc}</p>
      <StatChips s={calcStats(p.config)} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/build?preset=${p.slug}`} className="btn-ghost text-sm">Customize</Link>
        <button className="btn-accent text-sm" onClick={() => { add(p.name, structuredClone(p.config)); setDone(true); setTimeout(() => setDone(false), 1400); }}>{done ? "Added ✓" : "Add"}</button>
      </div>
    </article>
  );
}
