"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Fx, Tool, cupSpot, onFx, onStream } from "@/lib/fx";
import ToppingArt from "./ToppingArt";

const OUTLINE = "#3B2417";

/** The little tool (pitcher, nozzle, squeeze bottle, piping bag, shaker) that hovers over the cup while it dispenses. */
function ToolSprite({ tool, color }: { tool: Tool; color: string }) {
  if (tool === "pitcher") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-[38deg] drop-shadow" aria-hidden>
        <path d="M14 14h30l-4 38q-1 6-8 6h-6q-7 0-8-6z" fill={color} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M44 20q14 0 14 12t-14 12" fill="none" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
        <path d="M14 14l-6 -4" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === "bottle") {
    return (
      <svg viewBox="0 0 40 64" className="h-16 w-10 drop-shadow" aria-hidden>
        <path d="M12 4h16q4 0 4 6v30q0 6-6 8l-4 3h-4l-4-3q-6-2-6-8V10q0-6 4-6z" fill={color} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="17" y="49" width="6" height="13" rx="2" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
        <rect x="12" y="14" width="16" height="14" rx="3" fill="#fff" fillOpacity=".55" />
      </svg>
    );
  }
  if (tool === "whipper") {
    return (
      <svg viewBox="0 0 48 64" className="h-16 w-12 drop-shadow" aria-hidden>
        <path d="M6 4h36l-16 50h-4z" fill="#fffdf8" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 54h8l2 8h-12z" fill="#e8c27a" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 12l10 28" stroke="#e6d9c6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === "shaker") {
    return (
      <motion.svg viewBox="0 0 40 56" className="h-14 w-10 drop-shadow" aria-hidden animate={{ rotate: [-14, 14, -14] }} transition={{ duration: 0.22, repeat: Infinity }}>
        <rect x="6" y="2" width="28" height="10" rx="4" fill="#c9c9c9" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M8 12h24l-2 38q0 4-4 4h-12q-4 0-4-4z" fill={color} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="14" cy="49" r="1.6" fill={OUTLINE} /><circle cx="20" cy="50" r="1.6" fill={OUTLINE} /><circle cx="26" cy="49" r="1.6" fill={OUTLINE} />
      </motion.svg>
    );
  }
  return (
    <svg viewBox="0 0 48 30" className="h-8 w-12 drop-shadow" aria-hidden>
      <rect x="2" y="2" width="44" height="14" rx="6" fill="#8c8c8c" stroke={OUTLINE} strokeWidth="2.5" />
      <rect x="19" y="15" width="10" height="13" rx="3" fill="#6f6f6f" stroke={OUTLINE} strokeWidth="2.5" />
    </svg>
  );
}

const WIDTH: Record<Tool, number> = { pitcher: 9, nozzle: 6, bottle: 5, whipper: 14, shaker: 0 };

function Stream({ x, top, height, color, tool }: { x: number; top: number; height: number; color: string; tool: Tool }) {
  // Sauce and cream sweep left and right over the cup (like drawing a zig-zag); the rest pour straight down.
  const sweep = tool === "bottle" ? 30 : tool === "whipper" ? 8 : 0;
  const w = WIDTH[tool];
  return (
    <motion.div className="absolute" style={{ left: x, top }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <motion.div className="absolute" animate={sweep ? { x: [-sweep, sweep, -sweep] } : { x: 0 }} transition={{ duration: tool === "bottle" ? 0.7 : 0.5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="absolute -translate-x-1/2 -translate-y-[85%]"><ToolSprite tool={tool} color={color} /></div>
        {tool === "shaker" ? (
          // a rain of powder
          [0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full" style={{ background: color, left: (i % 3) * 9 - 9 }} initial={{ y: 0, opacity: 1 }} animate={{ y: height, opacity: [1, 1, 0] }} transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.07, ease: "easeIn" }} />
          ))
        ) : (
          <>
            <motion.div className="absolute -translate-x-1/2 origin-top rounded-full" style={{ width: w, background: color, boxShadow: "0 0 0 1.5px rgba(59,36,23,.35)" }} initial={{ height: 0 }} animate={{ height }} transition={{ duration: 0.22, ease: "easeOut" }} />
            <motion.span className="absolute h-3 w-10 -translate-x-1/2 rounded-full" style={{ top: height - 4, background: color, opacity: 0.8 }} animate={{ scaleX: [0.6, 1.2, 0.6] }} transition={{ duration: 0.35, repeat: Infinity }} />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function Piece({ e }: { e: Fx }) {
  if (e.kind === "fly") {
    const { from, to } = e;
    const peak = Math.min(from.y, to.y) - 110;
    const mx = (from.x + to.x) / 2;
    return (
      <motion.div
        className="absolute left-0 top-0 grid h-10 w-10 place-items-center text-3xl leading-none"
        initial={{ x: from.x - 20, y: from.y - 20, scale: 0.8, rotate: 0, opacity: 1 }}
        animate={{ x: [from.x - 20, mx - 20, to.x - 20], y: [from.y - 20, peak, to.y - 20], scale: [0.8, 1.3, 0.7], rotate: [0, 170, 340], opacity: [1, 1, 0] }}
        transition={{ duration: 0.62, x: { duration: 0.62, ease: "linear" }, y: { duration: 0.62, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] }, opacity: { duration: 0.62, times: [0, 0.8, 1] } }}
      >{e.glyph.startsWith("art:") ? <ToppingArt id={e.glyph.slice(4)} className="h-10 w-10" /> : e.glyph}</motion.div>
    );
  }
  if (e.kind === "burst") {
    return (
      <div className="absolute" style={{ left: e.at.x, top: e.at.y }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return <motion.span key={i} className="absolute -ml-1 -mt-1 h-2 w-2 rounded-full" style={{ background: e.color, boxShadow: "0 0 0 1px rgba(59,36,23,.25)" }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 38, y: Math.sin(a) * 30 - 8, opacity: 0, scale: 0.3 }} transition={{ duration: 0.5, ease: "easeOut" }} />;
        })}
      </div>
    );
  }
  if (e.kind === "drip") {
    return (
      <div className="absolute" style={{ left: e.at.x, top: e.at.y }}>
        <motion.span className="absolute -ml-[5px] block h-4 w-2.5 rounded-full" style={{ background: e.color, boxShadow: "0 0 0 1.5px rgba(59,36,23,.35)" }} initial={{ y: 0, opacity: 1 }} animate={{ y: 78, opacity: [1, 1, 0] }} transition={{ duration: 0.33, ease: "easeIn" }} />
      </div>
    );
  }
  return (
    <div className="absolute -translate-x-1/2" style={{ left: e.at.x, top: e.at.y }}>
      <motion.div className={`whitespace-nowrap rounded-full px-3 py-1 font-display text-lg font-extrabold shadow-float ${e.bad ? "bg-berry text-white" : "bg-caramel text-white"}`} initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={{ y: -54, opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1] }} transition={{ duration: 0.95, ease: "easeOut" }}>{e.text}</motion.div>
    </div>
  );
}

export default function FxLayer() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Fx[]>([]);
  const [streams, setStreams] = useState<Record<string, { color: string; tool: Tool }>>({});

  useEffect(() => onFx((e) => {
    setItems((l) => [...l, e]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== e.id)), 1300);
  }), []);

  useEffect(() => onStream((m) => setStreams((s) => {
    const next = { ...s };
    if ("off" in m) delete next[m.key];
    else next[m.key] = { color: m.color, tool: m.tool };
    return next;
  })), []);

  const spot = Object.keys(streams).length ? cupSpot() : null;
  const top = spot ? Math.max(70, spot.top - 60) : 0;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {items.filter((e) => !reduce || e.kind === "float").map((e) => <Piece key={e.id} e={e} />)}
      {!reduce && (
        <AnimatePresence>
          {spot && Object.entries(streams).map(([k, s]) => <Stream key={k} x={spot.x} top={top} height={Math.max(30, spot.top + spot.h * 0.55 - top)} color={s.color} tool={s.tool} />)}
        </AnimatePresence>
      )}
    </div>
  );
}
