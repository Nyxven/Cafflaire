"use client";
// Hands-on "barista bar" pieces: hold-to-pour buttons, pump bottles, pitchers, the espresso machine.
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

type HoldOpts = { fire: () => boolean | void; interval: number; onStart?: () => void; onStop?: () => void };

/**
 * Press-and-hold: fires once on press, then again every `interval` ms while held.
 * `fire` returns false when nothing happened (e.g. already at the max) and the hold stops.
 * Keyboard: Enter/Space fires once (a normal click with detail 0).
 */
export function useHold(opts: HoldOpts) {
  const cb = useRef(opts);
  cb.current = opts;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (!timer.current) return;
    clearInterval(timer.current);
    timer.current = null;
    cb.current.onStop?.();
  }, []);
  useEffect(() => stop, [stop]);

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || timer.current) return;
      if (cb.current.fire() === false) return;
      cb.current.onStart?.();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      timer.current = setInterval(() => { if (cb.current.fire() === false) stop(); }, cb.current.interval);
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
    onClick: (e: React.MouseEvent<HTMLElement>) => { if (e.detail === 0) cb.current.fire(); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

export function HoldButton({ label, className = "", children, ...opts }: HoldOpts & { label: string; className?: string; children: React.ReactNode }) {
  const h = useHold(opts);
  return <button type="button" aria-label={label} {...h} className={`touch-none select-none ${className}`}>{children}</button>;
}

export function Pips({ n, max, color = "bg-caramel" }: { n: number; max: number; color?: string }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: max }).map((_, i) => (
        <motion.span key={i} initial={false} animate={{ scale: i < n ? 1.15 : 0.8 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className={`h-3 w-3 rounded-full ${i < n ? color : "bg-espresso/15"}`} />
      ))}
    </div>
  );
}

export function EspressoMachine({ brewing }: { brewing: boolean }) {
  return (
    <motion.svg viewBox="0 0 220 150" className="mx-auto h-36 w-full max-w-[280px]" aria-hidden animate={{ x: brewing ? [0, -1.4, 1.4, 0] : 0 }} transition={brewing ? { duration: 0.15, repeat: Infinity } : { duration: 0.1 }}>
      <rect x="20" y="12" width="180" height="26" rx="12" className="fill-espresso" />
      <rect x="28" y="34" width="164" height="86" rx="14" className="fill-espresso/90" />
      <circle cx="58" cy="62" r="15" className="fill-cream" />
      <path d="M58 62 L58 51" strokeWidth="3" strokeLinecap="round" className="stroke-berry" transform={`rotate(${brewing ? 110 : -40} 58 62)`} />
      <rect x="92" y="46" width="86" height="12" rx="6" className="fill-caramel" />
      <rect x="96" y="66" width="52" height="16" rx="6" fill="#8c8c8c" />
      <rect x="116" y="82" width="10" height="12" rx="3" fill="#6f6f6f" />
      {brewing && [0, 1, 2].map((i) => (
        <motion.circle key={i} cx="121" cy="96" r="3" fill="#4a2c18" initial={{ y: 0, opacity: 1 }} animate={{ y: 22, opacity: 0 }} transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.15 }} />
      ))}
      <rect x="20" y="118" width="180" height="12" rx="6" className="fill-espresso" />
      <rect x="40" y="130" width="140" height="6" rx="3" className="fill-caramel/70" />
    </motion.svg>
  );
}

function Bottle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 64" className="h-16 w-10" aria-hidden>
      <g className="transition-transform duration-100 group-active:translate-y-[5px]">
        <rect x="13" y="0" width="14" height="5" rx="2" className="fill-espresso" />
        <rect x="19" y="4" width="2" height="9" className="fill-espresso/70" />
        <path d="M26 1h9v4h-9z" className="fill-espresso" />
      </g>
      <rect x="15" y="13" width="10" height="6" className="fill-espresso/40" />
      <path d="M8 25q0-6 7-6h10q7 0 7 6v31q0 6-6 6H14q-6 0-6-6z" fill={color} className="stroke-espresso/50" strokeWidth="2" />
      <rect x="12" y="34" width="16" height="14" rx="3" fill="#fff" fillOpacity=".55" />
    </svg>
  );
}

export function PitcherIcon({ color, className = "h-12 w-12" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M8 8h24l-3 30q-1 5-6 5h-6q-5 0-6-5z" fill={color} className="stroke-espresso/60" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 14q10 0 10 9t-10 9" fill="none" className="stroke-espresso/60" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 8l-4 -3" className="stroke-espresso/60" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SyrupRow({ name, price, color, n, max, pump, unpump }: { name: string; price: string; color: string; n: number; max: number; pump: () => boolean | void; unpump: () => void }) {
  return (
    <div className="card flex items-center gap-3 !p-3 !pr-12">
      <HoldButton label={`Pump ${name}. Hold to keep pumping`} fire={pump} interval={480} className="group grid h-20 w-16 shrink-0 place-items-center rounded-2xl bg-milk transition active:bg-caramel/25"><Bottle color={color} /></HoldButton>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{name}</div>
        <div className="text-sm opacity-70">{price}</div>
        <div className="mt-1.5"><Pips n={n} max={max} /></div>
      </div>
      <button type="button" className="btn-ghost h-11 w-11 shrink-0 !p-0 text-xl" aria-label={`Remove a pump of ${name}`} disabled={n <= 0} onClick={unpump}>−</button>
    </div>
  );
}
