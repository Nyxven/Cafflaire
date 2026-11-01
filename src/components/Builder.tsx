"use client";
import { AnimatePresence, motion, useAnimation, useDragControls, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useRef, useState } from "react";
import { BrewButton, EspressoMachine, Pips, PitcherIcon, SyrupRow, useBrewHold } from "./Bar";
import Cup, { Pour } from "./Cup";
import FxLayer from "./FxLayer";
import ToppingArt from "./ToppingArt";
import StatsPanel, { StatChips } from "./Stats";
import {
  BASES, BASE_MAP, MATCHA_PRICE, MILKS, SHOT_PRICE, SIZES, SYRUPS, SYRUP_MAP, TOPPINGS, MILK_MAP, TOPPING_MAP, Config, Size, Temp,
  calcStats, defaultName, fmt, priceLines, unitPrice, validateConfig,
} from "@/lib/catalog";
import {
  MAX_MATCHA, MAX_PUMPS, MAX_SHOTS, PITCHER_BACK_MS, PITCHER_LEAD_MS, PUMP_COOLDOWN_MS, SHOT_BREW_MS,
  describeIngredients, describeSize, milkPourMs,
} from "@/lib/brew";
import * as fx from "@/lib/fx";
import type { Pt } from "@/lib/fx";
import { play } from "@/lib/sound";
import { useBuilder, useCart } from "@/lib/store";

const STEPS = ["Base", "Size & temp", "Shots", "Milk", "Sweeteners", "Toppings", "Review"];

const ESPRESSO = "#4a2c18";
const MATCHA = "#7a9e5a";
const SYRUP_COLOR: Record<string, string> = { sugar: "#f5f0e6", brown: "#8a5a34", honey: "#e0a526", vanilla: "#f1dfa4", caramel: "#c68642", hazelnut: "#8b5a3c", mocha: "#4a2a1a" };
const TOP_COLOR: Record<string, string> = { whipped: "#fffdf8", caramel_drizzle: "#c68642", choco_drizzle: "#3b2417", cocoa: "#5a3a28", cookie: "#b07a45", marshmallow: "#ffffff" };
const cur = () => useBuilder.getState().config;

type Done = { name: string; config: Config; cents: number };

/**
 * Wraps an item so it can be dragged (by its ⠿ handle) onto the cup.
 * Tap/keyboard fallback: the item inside is always a normal button/stepper that does the same thing.
 */
function Drag({ cupRef, onDrop, onActive, children }: { cupRef: RefObject<HTMLDivElement | null>; onDrop: () => void; onActive: (b: boolean) => void; children: React.ReactNode }) {
  const controls = useDragControls();
  return (
    <motion.div
      drag dragControls={controls} dragListener={false} dragSnapToOrigin dragMomentum={false} dragElastic={0.15}
      whileDrag={{ scale: 1.05, zIndex: 60 }} className="relative"
      onDragStart={() => onActive(true)}
      onDragEnd={(_, info) => {
        onActive(false);
        const r = cupRef.current?.getBoundingClientRect();
        const x = info.point.x - window.scrollX;
        const y = info.point.y - window.scrollY;
        if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) onDrop();
      }}
    >
      {children}
      <span aria-hidden title="Drag onto the cup" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} style={{ touchAction: "none" }} className="absolute right-1.5 top-1.5 grid h-8 w-8 cursor-grab place-items-center rounded-full bg-espresso/10 text-sm active:cursor-grabbing">⠿</span>
    </motion.div>
  );
}

const choice = (on: boolean) => `relative w-full rounded-2xl border-2 p-4 pr-10 text-left transition active:scale-[.98] ${on ? "border-caramel bg-caramel/10" : "border-transparent bg-surface hover:border-espresso/20"} shadow-soft`;

/** Stars that pop around the finished drink. */
function Stars() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.span key={i} aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] text-xl text-caramel"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }} animate={{ x: Math.cos(a) * 92, y: Math.sin(a) * 70, opacity: [0, 1, 0], scale: [0.3, 1.2, 0.5] }}
            transition={{ duration: 0.9, delay: 0.15 + (i % 4) * 0.05, ease: "easeOut" }}>✦</motion.span>
        );
      })}
    </>
  );
}

export default function Builder({ preset }: { preset?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { config: c, name, step, editingId, patch, pickBase, setName, setStep, reset, loadPreset } = useBuilder();
  const addToCart = useCart((s) => s.add);
  const updateCart = useCart((s) => s.update);
  const [done, setDone] = useState<Done | null>(null);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const [dir, setDir] = useState(1);
  // cup reactions (none of these touch the drink itself)
  const [pour, setPour] = useState<Pour | null>(null);
  const [pouringId, setPouringId] = useState<string | null>(null);
  const [ripple, setRipple] = useState(0);
  const [shine, setShine] = useState(0);
  const cupCtl = useAnimation();
  const cupRef = useRef<HTMLDivElement>(null);
  const pillBar = useRef<HTMLOListElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // locks that stop rapid clicking from adding extra servings
  const pendingTop = useRef(new Set<string>());
  const matchaBusy = useRef(false);
  const pouring = useRef(false);
  const lastPump = useRef<Record<string, number>>({});
  const pourKey = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = (fn: () => void, ms: number) => {
    if (ms <= 0) { fn(); return; }
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  };
  /** Forget every pending animation callback (so a late one can't change a drink that was already finished or reset). */
  const clearPending = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    pendingTop.current.clear();
    matchaBusy.current = false;
    pouring.current = false;
    setPour(null);
    setPouringId(null);
  };
  useEffect(() => () => { timers.current.forEach(clearTimeout); fx.streamOff("milk"); fx.streamOff("espresso"); }, []);
  useEffect(() => { if (preset) loadPreset(preset); }, [preset, loadPreset]);

  const base = BASE_MAP[c.base];
  const stats = calcStats(c);
  const cents = unitPrice(c);
  const error = validateConfig(c);
  const finalName = name.trim() || defaultName(c);
  const last = step === STEPS.length - 1;

  // ---- cup reactions: each kind of action gets its own small effect ----
  const say = (m: string) => setMsg(m);
  const bump = () => { if (!reduce) void cupCtl.start({ rotate: [0, -2.5, 2.5, 0], scale: [1, 1.035, 1], transition: { duration: 0.35 } }); };
  const splash = () => { if (reduce) return; setRipple((r) => r + 1); void cupCtl.start({ scale: [1, 1.04, 0.985, 1], transition: { duration: 0.4 } }); };
  const shineCup = () => { if (!reduce) setShine((s) => s + 1); };
  /** Price pop + a reaction that fits what was added: solids bounce the cup, liquids make it ripple. */
  const cheer = (cents: number, up = true, delay = 0, kind: "solid" | "liquid" = "solid") => {
    fx.floatText(cents ? `${up ? "+" : "−"}${fmt(cents)}` : up ? "Free!" : "Removed", !up, delay);
    fx.haptic(up ? 14 : 8);
    const react = () => (up && kind === "liquid" ? splash() : bump());
    if (delay > 0) later(react, delay); else react();
  };

  // ---- moving between steps ----
  const goTo = (i: number) => {
    if (i === step || i < 0 || i >= STEPS.length) return;
    brew.cancel(); // never leave a half-brewed shot behind
    setDir(i > step ? 1 : -1);
    setStep(i);
    if (i > step) {
      if (i === STEPS.length - 1) { // the drink is done: ta-da
        later(() => { play("chime"); fx.sparkle(true); shineCup(); if (!reduce) void cupCtl.start({ y: [0, -12, 0], scale: [1, 1.06, 1], transition: { duration: 0.6 } }); }, 260);
      } else { play("tick"); fx.haptic(8); shineCup(); }
    } else play("tap");
  };
  useEffect(() => {
    // keep the current step's pill in view on small screens (scrolls the pill row only, never the page)
    const bar = pillBar.current;
    const pill = pillRefs.current[step];
    if (bar && pill) bar.scrollTo({ left: pill.offsetLeft - bar.clientWidth / 2 + pill.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  // ---- base / size / temperature ----
  const pickSize = (s: Size) => { if (cur().size === s) return; play("tap"); patch({ size: s }); bump(); };
  const pickTemp = (t: Temp) => {
    if (cur().temp === t) return;
    patch({ temp: t });
    play(t === "iced" ? "drop" : "tap");
    if (t === "iced") later(splash, 500); // ice cubes drop in, then the surface ripples
    say(`${t} selected`);
  };

  // ---- Milk: a pitcher swings over the cup, tilts, pours; the milk rises while it pours ----
  const setMilk = (id: string) => {
    if (pouring.current) return; // one pour at a time
    if (cur().milk === id) { play("tap"); return; }
    if (id === "none") { patch({ milk: id }); play("tap"); say("No milk"); bump(); return; }
    const m = MILK_MAP[id];
    const ms = milkPourMs(cur()); // bigger / milkier drinks pour longer
    pouring.current = true;
    play("pour");
    say(`Pouring ${m.name} milk`);
    const landed = () => {
      patch({ milk: id });
      setPour(null);
      setPouringId(null);
      cheer(m.price, true, 0, "liquid");
      say(`${m.name} milk selected`);
    };
    if (reduce) { landed(); pouring.current = false; return; }
    setPouringId(id);
    fx.pourFor("milk", m.color, "pitcher", PITCHER_LEAD_MS + ms);
    later(() => setPour({ zone: "milk", color: m.color, ms, key: ++pourKey.current, target: { ...cur(), milk: id } }), PITCHER_LEAD_MS);
    later(landed, PITCHER_LEAD_MS + ms);
    later(() => { pouring.current = false; }, PITCHER_LEAD_MS + ms + PITCHER_BACK_MS);
  };

  // ---- Espresso: hold the button; one full hold = one shot (rules in lib/brew.ts) ----
  const addShotNow = (): boolean => {
    const n = cur().shots;
    if (n >= MAX_SHOTS) { fx.floatText("Cup's full of shots!", true); return false; }
    patch({ shots: n + 1 });
    play("ding");
    fx.sparkle();
    cheer(SHOT_PRICE, true, 0, "liquid");
    say(`Espresso shots: ${n + 1}`);
    return true;
  };
  const brew = useBrewHold({
    canBrew: () => cur().shots < MAX_SHOTS,
    onBlocked: () => fx.floatText("Cup's full of shots!", true),
    onStart: () => {
      play("pour");
      say("Brewing espresso");
      fx.streamOn("espresso", ESPRESSO, "nozzle");
      setPour({ zone: "coffee", color: ESPRESSO, ms: SHOT_BREW_MS, key: ++pourKey.current, target: { ...cur(), shots: Math.min(MAX_SHOTS, cur().shots + 1) } });
    },
    onShot: () => { addShotNow(); }, // re-checks the limit, so a drag-and-drop mid-brew can't push past 4
    onStop: (why) => {
      fx.release("espresso", 250);
      setPour(null);
      if (why === "cancelled") say("Brew stopped. Hold until the bar is full to add a shot.");
    },
  });
  const dropShot = () => { addShotNow(); };
  const removeShot = () => { const n = cur().shots; if (n <= 0) return; patch({ shots: n - 1 }); play("tap"); cheer(SHOT_PRICE, false); say(`Espresso shots: ${n - 1}`); };

  // ---- Matcha: a scoop swings over the cup and the powder falls in ----
  const addMatcha = (from: fx.Src = null) => {
    if (matchaBusy.current) return; // one scoop at a time
    const n = cur().matcha;
    if (n >= MAX_MATCHA) { fx.floatText("Max scoops", true); return; }
    matchaBusy.current = true;
    play("drop");
    const land = reduce ? 0 : fx.scoop(from, MATCHA);
    later(() => {
      const m = cur().matcha;
      if (m < MAX_MATCHA) { patch({ matcha: m + 1 }); cheer(MATCHA_PRICE, true, 0, "solid"); say(`Matcha scoops: ${m + 1}`); }
      matchaBusy.current = false;
    }, land);
  };
  const removeMatcha = () => { const n = cur().matcha; if (n <= 0) return; patch({ matcha: n - 1 }); play("tap"); cheer(MATCHA_PRICE, false); say(`Matcha scoops: ${n - 1}`); };

  // ---- Syrups: press (or hold) the pump, a droplet travels from the spout into the cup ----
  const pump = (id: string, nozzle: Pt | null) => {
    const n = cur().syrups[id] ?? 0;
    if (n >= MAX_PUMPS) { fx.floatText("Max pumps", true); return false; }
    const now = Date.now();
    if (now - (lastPump.current[id] ?? 0) < PUMP_COOLDOWN_MS) return; // pumping takes a moment: ignore mashing
    lastPump.current[id] = now;
    patch({ syrups: { ...cur().syrups, [id]: n + 1 } });
    play("pump");
    const land = reduce ? 0 : fx.drop(nozzle, SYRUP_COLOR[id] ?? "#c68642");
    cheer(SYRUP_MAP[id].price, true, land, "liquid");
    say(`${SYRUP_MAP[id].name}: ${n + 1} pump${n + 1 > 1 ? "s" : ""}`);
    return true;
  };
  const unpump = (id: string) => {
    const n = cur().syrups[id] ?? 0;
    if (n <= 0) return;
    const next = { ...cur().syrups, [id]: n - 1 };
    if (n - 1 === 0) delete next[id];
    patch({ syrups: next });
    play("tap");
    cheer(SYRUP_MAP[id].price, false);
    say(`${SYRUP_MAP[id].name}: ${n - 1} pump${n - 1 === 1 ? "" : "s"}`);
  };

  // ---- Toppings: they fly / pour / drizzle into the cup (tap again to take them off) ----
  const toggleTopping = (id: string, mode: "toggle" | "add" = "toggle", from: fx.Src = null) => {
    if (pendingTop.current.has(id)) return;
    const t = TOPPING_MAP[id];
    const on = cur().toppings.includes(id);
    if (on && mode === "add") { fx.floatText("Already on!", true); return; }
    if (on) {
      patch({ toppings: cur().toppings.filter((x) => x !== id) });
      play("tap"); cheer(t.price, false); say(`${t.name} removed`);
      return;
    }
    const color = TOP_COLOR[id] ?? "#c68642";
    play(id.endsWith("_drizzle") ? "pump" : "drop");
    pendingTop.current.add(id);
    const land = reduce ? 0 : id.endsWith("_drizzle") ? fx.drizzle(color) : fx.fly(`art:${id}`, from, color);
    later(() => {
      const l = cur().toppings;
      patch({ toppings: l.includes(id) ? l : [...l, id] });
      pendingTop.current.delete(id);
      cheer(t.price, true, 0, "solid");
    }, land);
    say(`${t.name} added`);
  };

  // ---- Finishing: add to basket (or update the basket item) ----
  function finish() {
    if (error) return;
    clearPending();
    play("chime");
    fx.haptic(20);
    if (editingId) { updateCart(editingId, finalName, structuredClone(c)); reset(); router.push("/cart"); return; }
    addToCart(finalName, structuredClone(c));
    setDone({ name: finalName, config: structuredClone(c), cents });
  }

  const dnd = { cupRef, onActive: setDragging };
  // Same variants on server and client (so hydration matches); reduced motion just sets the slide distance to 0.
  const slide = { enter: (d: number) => ({ x: d * 36, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -36, opacity: 0 }) };
  const pct = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="pb-28">
      <FxLayer />
      <p className="sr-only" aria-live="polite">{msg}</p>

      <nav aria-label="Build progress" className="mb-5">
        <p className="mb-2 text-sm font-semibold">Step {step + 1} of {STEPS.length}: <span className="text-caramel">{STEPS[step]}</span></p>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-espresso/10" aria-hidden>
          <motion.div className="h-full rounded-full bg-caramel" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
        </div>
        <ol ref={pillBar} className="flex gap-1.5 overflow-x-auto" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button ref={(el) => { pillRefs.current[i] = el; }} onClick={() => goTo(i)} aria-current={i === step ? "step" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${i === step ? "bg-espresso text-cream" : i < step ? "bg-caramel/25" : "bg-surface"}`}>
                {i < step ? <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className="mr-1 inline-block text-caramel" aria-hidden>✓</motion.span> : null}
                {i + 1}. {s}{i < step && <span className="sr-only"> (done)</span>}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="sticky top-[4.75rem] z-20 bg-cream pb-2 lg:top-[5.5rem] lg:self-start lg:pb-0">
          <motion.div ref={cupRef} data-cup animate={cupCtl} className={`card grid place-items-center bg-gradient-to-b from-milk to-surface !p-3 lg:!p-5 ${dragging ? "ring-4 ring-caramel ring-offset-2 ring-offset-cream" : ""}`}>
            <Cup config={c} pour={pour} ripple={ripple} shine={shine} lively className="h-36 lg:h-72" />
            <p className="hidden font-display text-lg font-bold lg:block">{finalName}</p>
            <div className="mt-1 lg:hidden"><StatChips s={stats} /></div>
            {dragging && <p className="text-sm font-semibold text-caramel">Drop it on the cup!</p>}
          </motion.div>
          <div className="card mt-4 hidden lg:block"><StatsPanel s={stats} /></div>
        </aside>

        <section className="min-w-0">
          <AnimatePresence mode="wait" initial={false} custom={reduce ? 0 : dir}>
            <motion.div key={step} custom={reduce ? 0 : dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: reduce ? 0.01 : 0.2, ease: "easeOut" }}>
              {step === 0 && (
                <div><h2 className="mb-3 text-2xl font-bold">Pick your base</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {BASES.map((b) => (
                      <button key={b.id} aria-pressed={c.base === b.id} className={choice(c.base === b.id)} onClick={() => { play("tap"); pickBase(b.id); bump(); say(`${b.name} selected`); }}>
                        <div className="flex justify-between"><span className="text-2xl">{b.emoji}</span><span className="font-bold">{fmt(b.price)}</span></div>
                        <div className="mt-1 font-bold">{b.name}</div><div className="text-sm opacity-70">{b.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div><h2 className="mb-3 text-2xl font-bold">Choose a size</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(SIZES) as Size[]).map((s) => (
                        <button key={s} aria-pressed={c.size === s} className={choice(c.size === s)} onClick={() => pickSize(s)}>
                          <div className="font-bold">{SIZES[s].label}</div><div className="text-sm opacity-70">{SIZES[s].oz} oz</div><div className="text-sm font-semibold">{SIZES[s].up ? `+${fmt(SIZES[s].up)}` : "Included"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><h2 className="mb-3 text-2xl font-bold">Temperature</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {(["hot", "iced", "blended"] as Temp[]).map((t) => {
                        const ok = base.temps.includes(t);
                        return (
                          <button key={t} disabled={!ok} aria-pressed={c.temp === t} className={`${choice(c.temp === t)} disabled:opacity-40`} onClick={() => pickTemp(t)}>
                            <div className="text-2xl">{t === "hot" ? "🔥" : t === "iced" ? "🧊" : "🌀"}</div><div className="font-bold capitalize">{t}</div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm opacity-70">{base.name} is available {base.temps.join(" / ")}.</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm opacity-70">Hold the button until the bar fills: that&apos;s one shot (about a second each). Keep holding for more. Let go early and nothing is added. Or drag a card&apos;s ⠿ handle onto the cup.</p>
                  <Drag {...dnd} onDrop={dropShot}>
                    <div className="card !pr-12">
                      <h2 className="text-2xl font-bold">Espresso shots</h2>
                      <p className="text-sm opacity-70">{fmt(SHOT_PRICE)} each · ~63 mg caffeine</p>
                      <EspressoMachine brewing={brew.brewing} progress={brew.progress} />
                      <div className="mt-3 flex items-center gap-3">
                        <BrewButton progress={brew.progress} brewing={brew.brewing} handlers={brew.handlers} full={c.shots >= MAX_SHOTS} />
                        <button type="button" className="btn-ghost h-14 w-14 shrink-0 !p-0 text-xl" aria-label="Remove a shot" disabled={c.shots <= 0} onClick={removeShot}>↩</button>
                      </div>
                      <div className="mt-3 flex items-center justify-between"><Pips n={c.shots} max={MAX_SHOTS} /><span className="text-sm font-semibold">{c.shots} shot{c.shots === 1 ? "" : "s"}</span></div>
                    </div>
                  </Drag>
                  <Drag {...dnd} onDrop={() => addMatcha(null)}>
                    <div className="card !pr-12">
                      <h2 className="text-2xl font-bold">Matcha scoops</h2>
                      <p className="text-sm opacity-70">{fmt(MATCHA_PRICE)} each · ~35 mg caffeine</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button type="button" className="btn-accent !min-h-14 flex-1 !bg-matcha text-lg" onClick={(e) => addMatcha(e.currentTarget)}>🥄 Scoop matcha</button>
                        <button type="button" className="btn-ghost h-14 w-14 shrink-0 !p-0 text-xl" aria-label="Remove a scoop" disabled={c.matcha <= 0} onClick={removeMatcha}>↩</button>
                      </div>
                      <div className="mt-3 flex items-center justify-between"><Pips n={c.matcha} max={MAX_MATCHA} color="bg-matcha" /><span className="text-sm font-semibold">{c.matcha} scoop{c.matcha === 1 ? "" : "s"}</span></div>
                    </div>
                  </Drag>
                  {c.shots + c.matcha < 1 && <p className="text-sm text-berry">Add at least one shot or scoop.</p>}
                </div>
              )}

              {step === 3 && (
                <div><h2 className="mb-1 text-2xl font-bold">Pick your milk</h2><p className="mb-3 text-sm opacity-70">Tap a pitcher and watch it pour, or drag a ⠿ handle onto the cup.</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {MILKS.map((m) => (
                      <Drag key={m.id} {...dnd} onDrop={() => setMilk(m.id)}>
                        <button aria-pressed={c.milk === m.id} className={choice(c.milk === m.id)} onClick={() => setMilk(m.id)}>
                          <PitcherIcon color={m.id === "none" ? "transparent" : m.color} tilt={pouringId === m.id} className="mb-1 h-12 w-12" />
                          <div className="font-bold">{m.name}</div><div className="text-sm opacity-70">{m.price ? `+${fmt(m.price)}` : "Free"}</div>
                        </button>
                      </Drag>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div><h2 className="mb-1 text-2xl font-bold">Sweeten it up</h2><p className="mb-3 text-sm opacity-70">Press a bottle to pump (hold to keep pumping), up to {MAX_PUMPS} each. Or drag a ⠿ handle onto the cup.</p>
                  <div className="space-y-3">
                    {SYRUPS.map((s) => (
                      <Drag key={s.id} {...dnd} onDrop={() => { pump(s.id, null); }}>
                        <SyrupRow name={`${s.emoji} ${s.name}`} price={s.price ? `${fmt(s.price)} / pump` : "Free"} color={SYRUP_COLOR[s.id] ?? "#c68642"} n={c.syrups[s.id] ?? 0} max={MAX_PUMPS} pump={(nozzle) => pump(s.id, nozzle)} unpump={() => unpump(s.id)} />
                      </Drag>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div><h2 className="mb-1 text-2xl font-bold">Top it off</h2><p className="mb-3 text-sm opacity-70">Tap a topping and it goes onto your drink. Tap again to take it off, or drag a ⠿ handle onto the cup.</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TOPPINGS.map((t) => {
                      const on = c.toppings.includes(t.id);
                      return (
                        <Drag key={t.id} {...dnd} onDrop={() => toggleTopping(t.id, "add", null)}>
                          <button aria-pressed={on} className={choice(on)} onClick={(e) => toggleTopping(t.id, "toggle", e.currentTarget)}>
                            <div className="mb-2 grid h-16 w-16 place-items-center rounded-2xl bg-milk"><ToppingArt id={t.id} className="h-14 w-14" /></div><div className="font-bold">{t.name}</div><div className="text-sm opacity-70">+{fmt(t.price)}</div>
                            {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-caramel text-xs font-bold text-white" aria-hidden>✓</motion.span>}
                          </button>
                        </Drag>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Your masterpiece</h2>
                  <motion.div className="card text-center" initial={reduce ? false : { scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-caramel">Order up!</p>
                    <p className="mt-1 font-display text-3xl font-bold">{finalName}</p>
                    <p className="text-sm opacity-70">{describeSize(c)}</p>
                    <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {describeIngredients(c).map((t, i) => (
                        <motion.li key={t} className="chip" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>{t}</motion.li>
                      ))}
                    </ul>
                    <p className="mt-3 font-display text-2xl font-extrabold">{fmt(cents)}</p>
                  </motion.div>
                  <label className="block text-sm font-semibold">Name your drink<input className="input mt-1" maxLength={40} placeholder={defaultName(c)} value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <div className="card"><StatsPanel s={stats} /></div>
                  <div className="card">
                    <h3 className="mb-2 font-bold">Price breakdown</h3>
                    <ul className="space-y-1 text-sm">{priceLines(c).map((l, i) => <li key={i} className="flex justify-between"><span>{l.label}</span><span>{fmt(l.cents)}</span></li>)}</ul>
                    <div className="mt-3 flex justify-between border-t border-espresso/10 pt-3 text-lg font-bold"><span>Total</span><span>{fmt(cents)}</span></div>
                  </div>
                  {error && <p role="alert" className="text-sm text-berry">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div><div className="text-xs opacity-60">Total</div><motion.div key={cents} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 15 }} className="font-display text-2xl font-bold">{fmt(cents)}</motion.div></div>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={step === 0} onClick={() => goTo(step - 1)}>Back</button>
            {last ? <button className="btn-accent" disabled={!!error} onClick={finish}>{editingId ? "Update basket" : "Add to basket"}</button>
              : <button className="btn-primary" onClick={() => goTo(step + 1)}>Next</button>}
          </div>
        </div>
      </div>

      {done && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-espresso/40 p-4" role="dialog" aria-modal="true" aria-label="Added to basket">
          <motion.div initial={reduce ? false : { scale: 0.88, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="card relative w-full max-w-sm overflow-hidden text-center">
            {!reduce && <Stars />}
            <motion.div initial={reduce ? false : { y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.05 }} className="mx-auto w-fit">
              <Cup config={done.config} lively className="mx-auto h-44" />
            </motion.div>
            <motion.div initial={reduce ? false : { scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 12, delay: 0.3 }} className="mx-auto -mt-2 inline-flex items-center gap-1.5 rounded-full bg-matcha px-3 py-1 text-sm font-bold text-white"><span aria-hidden>✓</span> Added to basket</motion.div>
            <h2 className="mt-2 font-display text-2xl font-bold">{done.name}</h2>
            <p className="text-sm opacity-70">{describeSize(done.config)}</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">{describeIngredients(done.config).map((t) => <li key={t} className="chip">{t}</li>)}</ul>
            <div className="mt-2 flex justify-center"><StatChips s={calcStats(done.config)} /></div>
            <p className="my-3 font-display text-2xl font-extrabold">{fmt(done.cents)}</p>
            <div className="grid gap-2">
              <Link href="/cart" autoFocus onClick={() => { clearPending(); reset(); }} className="btn-primary">View basket</Link>
              <button className="btn-accent" onClick={() => { clearPending(); reset(); setDone(null); }}>Build another</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
