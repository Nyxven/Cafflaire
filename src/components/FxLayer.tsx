"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Fx, Tool, cupSpot, onFx, onStream } from "@/lib/fx";
import ToppingArt from "./ToppingArt";

const INK = "#3B2417";

/** Milk pitcher, drawn with its spout at the top-left corner (0,0 of the box = the spout tip). */
function Pitcher({ color }: { color: string }) {
  return (
    <svg viewBox="-4 -4 68 68" className="h-[68px] w-[68px] drop-shadow" aria-hidden>
      <path d="M0 0h30l-4 40q-1 6-8 6h-6q-7 0-8-6z" transform="translate(4 4)" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 14q14 0 14 12t-14 12" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M4 4l-6 -4" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Nozzle() {
  return (
    <svg viewBox="0 0 48 30" className="h-8 w-12 drop-shadow" aria-hidden>
      <rect x="2" y="2" width="44" height="14" rx="6" fill="#8c8c8c" stroke={INK} strokeWidth="2.5" />
      <rect x="19" y="15" width="10" height="13" rx="3" fill="#6f6f6f" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

/** A tool hovering over the cup with a liquid stream falling into it. */
function Stream({ x, top, height, color, tool }: { x: number; top: number; height: number; color: string; tool: Tool }) {
  const pitcher = tool === "pitcher";
  const w = pitcher ? 9 : 6;
  return (
    <motion.div className="absolute left-0 top-0" initial={false} exit={{ opacity: 1, transition: { duration: pitcher ? 0.34 : 0.2 } }}>
      {/* the tool: a pitcher swings in and tilts, a nozzle just appears */}
      {pitcher ? (
        <motion.div
          className="absolute"
          style={{ left: x - 4, top: top - 4, transformOrigin: "4px 4px" }}
          initial={{ x: 96, y: -34, rotate: 0, opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: -34, opacity: 1 }}
          exit={{ x: 96, y: -34, rotate: 0, opacity: 0, transition: { duration: 0.32, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 170, damping: 15 }}
        >
          <Pitcher color={color} />
        </motion.div>
      ) : (
        <motion.div className="absolute" style={{ left: x - 24, top: top - 26 }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}>
          <Nozzle />
        </motion.div>
      )}
      {/* the stream starts after the pitcher has tilted */}
      <motion.div
        className="absolute origin-top rounded-full"
        style={{ left: x - w / 2, top, width: w, background: color, boxShadow: "0 0 0 1.5px rgba(59,36,23,.35)" }}
        initial={{ height: 0 }}
        animate={{ height }}
        exit={{ height: 0, transition: { duration: 0.18 } }}
        transition={{ duration: 0.24, ease: "easeOut", delay: pitcher ? 0.3 : 0 }}
      />
      <motion.span
        className="absolute h-3 w-10 rounded-full"
        style={{ left: x - 20, top: top + height - 4, background: color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8, scaleX: [0.6, 1.2, 0.6] }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ scaleX: { duration: 0.35, repeat: Infinity }, opacity: { delay: pitcher ? 0.4 : 0.1, duration: 0.15 } }}
      />
    </motion.div>
  );
}

function Drop({ color }: { color: string }) {
  return <span className="block h-5 w-3.5 rounded-b-full rounded-t-[60%]" style={{ background: color, boxShadow: "0 0 0 1.5px rgba(59,36,23,.35)" }} />;
}

function Piece({ e }: { e: Fx }) {
  if (e.kind === "fly") {
    const { from, to } = e;
    const isDrop = e.glyph.startsWith("drop:");
    const lift = isDrop ? 26 : e.tilt ? 70 : 110;
    const peak = Math.min(from.y, to.y) - lift;
    const mx = (from.x + to.x) / 2;
    const d = e.ms / 1000;
    return (
      <motion.div
        className="absolute left-0 top-0 grid h-10 w-10 place-items-center text-3xl leading-none"
        initial={{ x: from.x - 20, y: from.y - 20, scale: 0.8, rotate: 0, opacity: 1 }}
        animate={{
          x: [from.x - 20, mx - 20, to.x - 20],
          y: [from.y - 20, peak, to.y - 20],
          scale: isDrop ? [0.8, 1, 0.8] : [0.8, 1.3, e.tilt ? 1.1 : 0.7],
          rotate: isDrop ? [0, 0, 0] : e.tilt ? [0, -12, -62] : [0, 170, 340],
          opacity: [1, 1, isDrop ? 0.9 : e.tilt ? 1 : 0.9],
        }}
        transition={{ duration: d, x: { duration: d, ease: "linear" }, y: { duration: d, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] } }}
      >
        {isDrop ? <Drop color={e.glyph.slice(5)} /> : e.glyph.startsWith("art:") ? <ToppingArt id={e.glyph.slice(4)} className="h-10 w-10" /> : e.glyph}
      </motion.div>
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
  if (e.kind === "sparkle") {
    const count = e.big ? 10 : 6;
    const r = e.big ? 88 : 56;
    return (
      <div className="absolute" style={{ left: e.at.x, top: e.at.y }}>
        {Array.from({ length: count }).map((_, i) => {
          const a = (i / count) * Math.PI * 2 + 0.3;
          const far = r * (i % 2 ? 0.7 : 1);
          return (
            <motion.span key={i} className="absolute -ml-2 -mt-2 text-base leading-none text-caramel" style={{ fontSize: e.big ? 22 - (i % 3) * 4 : 16 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
              animate={{ x: Math.cos(a) * far, y: Math.sin(a) * far * 0.8, opacity: [0, 1, 0], scale: [0.2, 1.2, 0.4], rotate: 90 }}
              transition={{ duration: e.big ? 0.9 : 0.7, ease: "easeOut", delay: (i % 3) * 0.04 }}>✦</motion.span>
          );
        })}
      </div>
    );
  }
  if (e.kind === "powder") {
    return (
      <div className="absolute" style={{ left: e.at.x, top: e.at.y }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full" style={{ background: e.color, left: ((i * 7) % 21) - 10 }}
            initial={{ y: 0, opacity: 0 }} animate={{ y: 62 + (i % 4) * 6, opacity: [0, 1, 1, 0] }} transition={{ duration: 0.45, delay: i * 0.025, ease: "easeIn" }} />
        ))}
      </div>
    );
  }
  if (e.kind === "drizzle") {
    return (
      <svg width="44" height="112" viewBox="0 0 44 112" className="absolute -translate-x-1/2 overflow-visible" style={{ left: e.at.x, top: e.at.y }}>
        <motion.path d="M22 0 C 8 18, 36 34, 22 52 S 8 88, 22 108" fill="none" stroke={e.color} strokeWidth="6" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }} transition={{ duration: 0.85, times: [0, 0.55, 1], ease: "easeOut" }} />
      </svg>
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
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const live = timers.current;
    const off = onFx((e) => {
      setItems((l) => [...l, e]);
      const t = setTimeout(() => { live.delete(t); setItems((l) => l.filter((x) => x.id !== e.id)); }, 1300);
      live.add(t);
    });
    return () => { off(); live.forEach(clearTimeout); live.clear(); };
  }, []);

  useEffect(() => onStream((m) => setStreams((s) => {
    const next = { ...s };
    if ("off" in m) delete next[m.key];
    else next[m.key] = { color: m.color, tool: m.tool };
    return next;
  })), []);

  const spot = Object.keys(streams).length ? cupSpot() : null;
  const top = spot ? spot.top + 14 : 0; // just inside the cup card, above the rim

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
