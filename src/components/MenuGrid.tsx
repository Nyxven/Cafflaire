"use client";
import { LayoutGroup, motion } from "framer-motion";
import { useState } from "react";
import PresetCard from "./PresetCard";
import { Item, Stagger } from "./Reveal";
import { PRESETS } from "@/lib/catalog";

const TABS = ["All", "Coffee", "Frappe", "Matcha", "Specialty"] as const;

export default function MenuGrid() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const list = PRESETS.filter((p) => tab === "All" || p.category === tab);
  return (
    <>
      <LayoutGroup id="menu-tabs">
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-milk/70 p-1 sm:inline-flex" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === t ? "text-cream" : "hover:text-caramel"}`}>
              {tab === t && <motion.span layoutId="menu-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-espresso" />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      {/* key = tab, so the cards settle in again whenever the filter changes */}
      <Stagger key={tab} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => <Item key={p.slug}><PresetCard p={p} /></Item>)}
      </Stagger>
    </>
  );
}
