"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME, LogoMark } from "./Logo";

const Wheel = ({ cx }: { cx: number }) => (
  <g className="animate-spin [transform-box:fill-box] [transform-origin:center]" style={{ animationDuration: "0.7s" }}>
    <circle cx={cx} cy="112" r="14" fill="#3B2417" /><circle cx={cx} cy="112" r="6" fill="#C68642" /><path d={`M${cx - 12} 112h24`} stroke="#FFF8F0" strokeWidth="2" />
  </g>
);

/** Brand intro: Cafflaire logo + wordmark animate in, then the truck drives past (voice is switched off for now). */
export default function Truck({ next = "/home" }: { next?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const letters = APP_NAME.split("");

  useEffect(() => {
    const t = setTimeout(() => router.replace(next), reduce ? 2200 : 4600);
    return () => clearTimeout(t);
  }, [router, reduce, next]);

  const onTap = () => router.replace(next);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-b from-milk to-cream" onClick={onTap}>
      <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-center">
        {!reduce && [0, 1, 2].map((i) => (
          <motion.span key={i} aria-hidden className="absolute left-1/2 top-1/2 -ml-24 -mt-24 h-48 w-48 rounded-full border-2 border-caramel/50" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: [0.5, 2.6], opacity: [0.7, 0] }} transition={{ duration: 1.8, delay: 0.5 + i * 0.45, ease: "easeOut" }} />
        ))}
        <motion.div className="relative mx-auto w-fit" initial={reduce ? false : { scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 14 }}>
          <LogoMark className="h-20 w-20 sm:h-24 sm:w-24" />
        </motion.div>
        <h1 className="relative mt-4 flex justify-center text-5xl font-bold sm:text-7xl" aria-label={APP_NAME}>
          {letters.map((ch, i) => (
            <motion.span key={i} aria-hidden initial={reduce ? false : { y: 34, opacity: 0, rotate: 8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 320, damping: 17 }}>{ch}</motion.span>
          ))}
        </h1>
        <motion.p className="relative mt-2 text-sm opacity-70 sm:text-base" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.5 }}>Your coffee, your recipe.</motion.p>
        <p className="relative mt-4 text-xs opacity-50">Tap anywhere to skip</p>
      </div>

      <div className="absolute inset-x-0 top-[72%] h-2 bg-espresso/80" />
      <div className="absolute inset-x-0 top-[72%] mt-5 border-t-4 border-dashed border-espresso/30" />
      {reduce ? (
        <div className="absolute top-[64%] text-6xl">🚚☕</div>
      ) : (
        <motion.div className="absolute top-[72%] -mt-[118px]" initial={{ x: "-300px" }} animate={{ x: "calc(100vw + 40px)" }} transition={{ duration: 2.6, delay: 0.9, ease: "easeInOut" }}>
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

      <button type="button" className="btn-ghost absolute bottom-8 left-1/2 -translate-x-1/2" onClick={(e) => { e.stopPropagation(); router.replace(next); }}>Skip</button>
    </main>
  );
}
