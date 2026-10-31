"use client";
import { useState } from "react";
import PresetCard from "./PresetCard";
import { PRESETS } from "@/lib/catalog";

const TABS = ["All", "Coffee", "Frappe", "Matcha"] as const;

export default function MenuGrid() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const list = PRESETS.filter((p) => tab === "All" || p.category === tab);
  return (
    <>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn shrink-0 ${tab === t ? "bg-espresso text-cream" : "bg-surface"}`}>{t}</button>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map((p) => <PresetCard key={p.slug} p={p} />)}</div>
    </>
  );
}
