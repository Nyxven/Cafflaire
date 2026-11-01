"use client";
// Hands-on "barista bar" pieces: hold-to-brew button, espresso machine, pump bottles, pitchers.
import { animate, motion, useAnimation, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrewHooks, SHOT_BREW_MS, createBrew } from "@/lib/brew";
import type { Pt } from "@/lib/fx";

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

export function HoldButton({ label, className = "", children, buttonRef, ...opts }: HoldOpts & { label: string; className?: string; children: React.ReactNode; buttonRef?: React.Ref<HTMLButtonElement> }) {
  const h = useHold(opts);
  return <button ref={buttonRef} type="button" aria-label={label} {...h} className={`touch-none select-none ${className}`}>{children}</button>;
}

/**
 * Hold-to-brew. Holding for one full shot-time adds ONE shot (see lib/brew.ts for the rules, which are unit-tested).
 * `progress` (0..1) is a motion value, so the bar and machine update without re-rendering React every frame.
 */
export function useBrewHold(h: Pick<BrewHooks, "canBrew" | "onStart" | "onShot" | "onStop" | "onBlocked">) {
  const progress = useMotionValue(0);
  const [brewing, setBrewing] = useState(false);
  const cb = useRef(h);
  cb.current = h;
  const anim = useRef<{ stop: () => void } | null>(null);

  const ctl = useMemo(() => createBrew({
    canBrew: () => cb.current.canBrew(),
    onBlocked: () => cb.current.onBlocked?.(),
    onStart: () => {
      setBrewing(true);
      anim.current?.stop();
      progress.set(0);
      anim.current = animate(progress, 1, { duration: SHOT_BREW_MS / 1000, ease: "linear" });
      cb.current.onStart();
    },
    onShot: () => cb.current.onShot(),
    onStop: (why) => {
      setBrewing(false);
      anim.current?.stop();
      anim.current = animate(progress, 0, { duration: why === "done" ? 0.4 : 0.2, delay: why === "done" ? 0.12 : 0 });
      cb.current.onStop(why);
    },
  }), [progress]);
  useEffect(() => () => { ctl.dispose(); anim.current?.stop(); }, [ctl]);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if (ctl.press()) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    },
    onPointerUp: () => ctl.release(),
    onPointerCancel: () => ctl.release(),
    onLostPointerCapture: () => ctl.release(),
    onClick: (e: React.MouseEvent<HTMLElement>) => { if (e.detail === 0) ctl.auto(); }, // keyboard / screen reader
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  return { progress, brewing, handlers, cancel: () => ctl.dispose() };
}

export function BrewButton({ progress, brewing, handlers, full }: { progress: MotionValue<number>; brewing: boolean; handlers: ReturnType<typeof useBrewHold>["handlers"]; full: boolean }) {
  const width = useTransform(progress, (v) => `${v * 100}%`);
  return (
    <button type="button" {...handlers} aria-label="Brew espresso. Press and hold to fill a shot, or press Enter or Space to brew one shot" disabled={full && !brewing}
      className="btn-accent relative !min-h-14 flex-1 touch-none select-none overflow-hidden text-lg disabled:opacity-60">
      <motion.span aria-hidden className="absolute inset-y-0 left-0 bg-white/35" style={{ width }} />
      <span className="relative">{full && !brewing ? "Cup's full of shots" : brewing ? "Brewing… keep holding" : "☕ Hold to brew"}</span>
    </button>
  );
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

export function EspressoMachine({ brewing, progress }: { brewing: boolean; progress: MotionValue<number> }) {
  const bar = useTransform(progress, (v) => v * 80);
  const sink = useTransform(progress, (v) => (1 - v) * 15); // how far the espresso is still below the rim
  return (
    <svg viewBox="0 0 220 150" className={`mx-auto h-36 w-full max-w-[280px] ${brewing ? "brew-shake" : ""}`} aria-hidden>
      <rect x="20" y="12" width="180" height="26" rx="12" className="fill-espresso" />
      <rect x="28" y="34" width="164" height="86" rx="14" className="fill-espresso/90" />
      <circle cx="58" cy="62" r="15" className="fill-cream" />
      <path d="M58 62 L58 51" strokeWidth="3" strokeLinecap="round" className="stroke-berry" transform={`rotate(${brewing ? 110 : -40} 58 62)`} />
      {/* progress display */}
      <rect x="92" y="46" width="86" height="12" rx="6" className="fill-caramel" />
      <motion.rect x="95" y="49" height="6" rx="3" fill="#fffdf8" fillOpacity=".9" style={{ width: bar }} />
      <circle cx="165" cy="72" r="5" fill={brewing ? "#7ac36a" : "#6b5a4d"} className={brewing ? "animate-pulse" : ""} />
      {/* group head + spout */}
      <rect x="96" y="66" width="52" height="16" rx="6" fill="#8c8c8c" />
      <rect x="116" y="82" width="10" height="10" rx="3" fill="#6f6f6f" />
      {brewing && <motion.rect x="119.5" y="92" width="3" rx="1.5" fill="#4a2c18" initial={{ height: 0 }} animate={{ height: 20 }} transition={{ duration: 0.15 }} />}
      {/* little cup under the spout that fills while you hold */}
      <clipPath id="mcup"><path d="M104 102 h34 l-3 14 q-1 3 -5 3 h-18 q-4 0 -5 -3 z" /></clipPath>
      <g clipPath="url(#mcup)"><motion.rect x="100" y="105" width="42" height="15" fill="#4a2c18" style={{ y: sink }} /></g>
      <path d="M104 102 h34 l-3 14 q-1 3 -5 3 h-18 q-4 0 -5 -3 z" fill="none" stroke="#fffdf8" strokeOpacity=".7" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M138 105 q9 0 9 6 t-9 6" fill="none" stroke="#fffdf8" strokeOpacity=".7" strokeWidth="1.6" />
      {brewing && [0, 1].map((i) => (
        <motion.path key={i} d={`M${112 + i * 18} 100 q-3 -5 0 -9`} fill="none" stroke="#fffdf8" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 0.7, 0], y: -8 }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      <rect x="20" y="118" width="180" height="12" rx="6" className="fill-espresso" />
      <rect x="40" y="130" width="140" height="6" rx="3" className="fill-caramel/70" />
    </svg>
  );
}

function Bottle({ color, head }: { color: string; head: ReturnType<typeof useAnimation> }) {
  return (
    <svg viewBox="0 0 40 64" className="h-16 w-10" aria-hidden data-bottle>
      <motion.g animate={head}>
        <rect x="13" y="0" width="14" height="5" rx="2" className="fill-espresso" />
        <rect x="19" y="4" width="2" height="9" className="fill-espresso/70" />
        <path d="M26 1h9v4h-9z" className="fill-espresso" />
      </motion.g>
      <rect x="15" y="13" width="10" height="6" className="fill-espresso/40" />
      <path d="M8 25q0-6 7-6h10q7 0 7 6v31q0 6-6 6H14q-6 0-6-6z" fill={color} className="stroke-espresso/50" strokeWidth="2" />
      <rect x="12" y="34" width="16" height="14" rx="3" fill="#fff" fillOpacity=".55" />
    </svg>
  );
}

/** Milk pitcher card icon. It tips over while its milk is being poured. */
export function PitcherIcon({ color, className = "h-12 w-12", tilt = false }: { color: string; className?: string; tilt?: boolean }) {
  return (
    <motion.svg viewBox="0 0 48 48" className={className} aria-hidden style={{ transformOrigin: "20% 20%" }} animate={{ rotate: tilt ? -28 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 14 }}>
      <path d="M8 8h24l-3 30q-1 5-6 5h-6q-5 0-6-5z" fill={color} className="stroke-espresso/60" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 14q10 0 10 9t-10 9" fill="none" className="stroke-espresso/60" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 8l-4 -3" className="stroke-espresso/60" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}

export function SyrupRow({ name, price, color, n, max, pump, unpump }: { name: string; price: string; color: string; n: number; max: number; pump: (nozzle: Pt | null) => boolean | void; unpump: () => void }) {
  const head = useAnimation();
  const btn = useRef<HTMLButtonElement>(null);
  const press = () => {
    void head.start({ y: [0, 7, 0], transition: { duration: 0.3, times: [0, 0.4, 1] } }); // the pump head goes down and comes back up
    const svg = btn.current?.querySelector("[data-bottle]");
    const r = svg?.getBoundingClientRect();
    return pump(r ? { x: r.left + r.width * 0.78, y: r.top + r.height * 0.06 } : null); // droplet leaves from the spout
  };
  return (
    <div className="card flex items-center gap-3 !p-3 !pr-12">
      <HoldButton buttonRef={btn} label={`Pump ${name}. Hold to keep pumping`} fire={press} interval={480} className="group grid h-20 w-16 shrink-0 place-items-center rounded-2xl bg-milk transition active:bg-caramel/25"><Bottle color={color} head={head} /></HoldButton>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{name}</div>
        <div className="text-sm opacity-70">{price}</div>
        <div className="mt-1.5"><Pips n={n} max={max} /></div>
      </div>
      <button type="button" className="btn-ghost h-11 w-11 shrink-0 !p-0 text-xl" aria-label={`Remove a pump of ${name}`} disabled={n <= 0} onClick={unpump}>−</button>
    </div>
  );
}
