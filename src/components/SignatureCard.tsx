"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Cup from "./Cup";
import Ring from "./Ring";
import { StatChips } from "./Stats";
import { Config, calcStats, fmt, unitPrice } from "@/lib/catalog";
import { play } from "@/lib/sound";
import { useBuilder, useCart } from "@/lib/store";

/** A drink picked for someone: big cup, why it suits them, add it or tweak it. */
export default function SignatureCard({ name, config, reasons }: { name: string; config: Config; reasons: string[] }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const customize = () => { useBuilder.setState({ config: structuredClone(config), name, step: 0, editingId: null }); router.push("/build"); };
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto grid w-52 place-items-center">
        <Ring draw className="absolute inset-0 m-auto h-[125%] w-[125%] text-caramel" />
        <Cup config={config} className="relative h-64" />
      </div>
      <div>
        <h2 className="text-3xl font-bold leading-tight">{name}</h2>
        <p className="mt-1 text-lg font-semibold">{fmt(unitPrice(config))}</p>
        <ul className="mt-3 space-y-1 text-sm">{reasons.map((r) => <li key={r} className="flex gap-2"><span className="text-matcha" aria-hidden>✓</span>{r}</li>)}</ul>
        <div className="mt-3"><StatChips s={calcStats(config)} /></div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-accent" onClick={() => { add(name, structuredClone(config)); play("chime"); setDone(true); }}>{done ? "Added to basket ✓" : "Add to basket"}</button>
          <button className="btn-ghost" onClick={customize}>Customize</button>
        </div>
      </div>
    </div>
  );
}
