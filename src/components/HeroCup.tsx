"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Cup from "./Cup";
import Ring from "./Ring";
import { PRESET_MAP, fmt, unitPrice } from "@/lib/catalog";

const SLUGS = ["caramel-frappe", "vanilla-iced-latte", "iced-matcha", "mocha-latte"];

/** Landing hero: one cup that re-pours itself into different drinks, with its name and price. */
export default function HeroCup() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLUGS.length), 3400);
    return () => clearInterval(t);
  }, [reduce]);
  const p = PRESET_MAP[SLUGS[i]];
  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      {/* A square stage: the ring fills it and the cup sits in the exact middle. */}
      <div className="relative aspect-square w-full">
        <Ring draw className="absolute inset-0 h-full w-full text-caramel" />
        <Cup config={p.config} className="absolute inset-[11%] h-[78%] w-[78%] drop-shadow-xl" />
      </div>
      <div className="relative -mt-2 h-16 w-full text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div key={p.slug} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <div className="font-display text-2xl font-bold">{p.name}</div>
            <div className="text-sm"><span className="font-semibold">{fmt(unitPrice(p.config))}</span> <span className="opacity-70">{p.desc}</span></div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
