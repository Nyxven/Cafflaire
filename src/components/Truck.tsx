"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Wheel = ({ cx }: { cx: number }) => (
  <g className="animate-spin [transform-box:fill-box] [transform-origin:center]" style={{ animationDuration: "0.7s" }}>
    <circle cx={cx} cy="112" r="14" fill="#3B2417" /><circle cx={cx} cy="112" r="6" fill="#C68642" /><path d={`M${cx - 12} 112h24`} stroke="#FFF8F0" strokeWidth="2" />
  </g>
);

export default function Truck() {
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/home"), reduce ? 700 : 2800);
    return () => clearTimeout(t);
  }, [router, reduce]);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-b from-milk to-cream" onClick={() => router.replace("/home")}>
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Brewing your experience…</h1>
        <p className="mt-1 text-sm opacity-70">Tap anywhere to skip</p>
      </div>
      <div className="absolute inset-x-0 top-[58%] h-2 bg-espresso/80" />
      <div className="absolute inset-x-0 top-[58%] mt-5 border-t-4 border-dashed border-espresso/30" />
      {reduce ? (
        <div className="text-7xl">🚚☕</div>
      ) : (
        <motion.div className="absolute top-[58%] -mt-[118px]" initial={{ x: "-300px" }} animate={{ x: "calc(100vw + 40px)" }} transition={{ duration: 2.6, ease: "easeInOut" }}>
          <motion.svg width="260" height="130" viewBox="0 0 260 130" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.35, repeat: Infinity }} aria-hidden>
            <rect x="8" y="18" width="150" height="82" rx="10" fill="#C68642" />
            <rect x="22" y="34" width="96" height="30" rx="4" fill="#FFF8F0" /><path d="M16 34h108l-8 -14h-92z" fill="#B5446E" />
            <text x="70" y="55" textAnchor="middle" fontSize="14" fontWeight="700" fill="#3B2417">COFFEE ☕</text>
            <path d="M158 44h50l30 30v26H158z" fill="#3B2417" /><path d="M170 52h30l16 18h-46z" fill="#cfe8f0" />
            <rect x="4" y="96" width="240" height="8" rx="4" fill="#3B2417" />
            <Wheel cx={52} /><Wheel cx={196} />
            {[0, 1, 2].map((i) => <motion.circle key={i} cx="-4" cy="90" r="6" fill="#3B2417" fillOpacity=".15" animate={{ x: [-4, -40], opacity: [0.6, 0], scale: [0.6, 1.6] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }} />)}
          </motion.svg>
        </motion.div>
      )}
    </main>
  );
}
