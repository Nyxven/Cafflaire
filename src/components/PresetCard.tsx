"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Cup from "./Cup";
import Ring from "./Ring";
import { StatChips } from "./Stats";
import { Config, Preset, calcStats, fmt, unitPrice } from "@/lib/catalog";
import { play } from "@/lib/sound";
import { useBuilder, useCart } from "@/lib/store";

/** `config` overrides the menu recipe (used for drinks adapted to someone's tastes). */
export default function PresetCard({ p, config, badge }: { p: Preset; config?: Config; badge?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const c = config ?? p.config;
  const customize = () => { useBuilder.setState({ config: structuredClone(c), name: p.name, step: 0, editingId: null }); router.push("/build"); };
  return (
    <article className="card group flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:shadow-float">
      <div className="relative grid place-items-center overflow-hidden rounded-2xl bg-milk/70 py-4">
        <Ring className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 text-caramel/50 transition-transform duration-500 group-hover:rotate-12" />
        <Cup config={c} className="relative h-40 transition-transform duration-300 group-hover:scale-105" />
        {badge && <span className="absolute left-3 top-3 rounded-full bg-caramel px-3 py-1 text-xs font-bold text-white">{badge}</span>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-tight">{p.name}</h3>
        <span className="font-bold">{fmt(unitPrice(c))}</span>
      </div>
      <p className="mb-2 text-sm opacity-70">{p.desc}</p>
      <StatChips s={calcStats(c)} />
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        {config
          ? <button className="btn-ghost text-sm" onClick={customize}>Customize</button>
          : <Link href={`/build?preset=${p.slug}`} className="btn-ghost text-sm">Customize</Link>}
        <button className="btn-accent text-sm" onClick={() => { add(p.name, structuredClone(c)); play("chime"); setDone(true); setTimeout(() => setDone(false), 1400); }}>{done ? "Added ✓" : "Add"}</button>
      </div>
    </article>
  );
}
