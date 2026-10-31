"use client";
import { motion, useAnimation, useDragControls } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useRef, useState } from "react";
import { EspressoMachine, HoldButton, Pips, PitcherIcon, SyrupRow } from "./Bar";
import Cup from "./Cup";
import FxLayer from "./FxLayer";
import ToppingArt from "./ToppingArt";
import StatsPanel, { StatChips } from "./Stats";
import {
  BASES, BASE_MAP, MATCHA_PRICE, MILKS, SHOT_PRICE, SIZES, SYRUPS, SYRUP_MAP, TOPPINGS, MILK_MAP, TOPPING_MAP, Size, Temp,
  calcStats, defaultName, fmt, priceLines, unitPrice, validateConfig,
} from "@/lib/catalog";
import * as fx from "@/lib/fx";
import { play, type Sfx } from "@/lib/sound";
import { useBuilder, useCart } from "@/lib/store";

const STEPS = ["Base", "Size & temp", "Shots", "Milk", "Sweeteners", "Toppings", "Review"];

const SYRUP_COLOR: Record<string, string> = { sugar: "#f5f0e6", brown: "#8a5a34", honey: "#e0a526", vanilla: "#f1dfa4", caramel: "#c68642", hazelnut: "#8b5a3c", mocha: "#4a2a1a" };
const TOP_COLOR: Record<string, string> = { whipped: "#fffdf8", caramel_drizzle: "#c68642", choco_drizzle: "#3b2417", cocoa: "#5a3a28", cookie: "#b07a45", marshmallow: "#ffffff" };
const cur = () => useBuilder.getState().config;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Toppings that come out of a dispenser instead of flying in: which tool, how long it runs, when the cup receives it.
const DISPENSE: Record<string, { tool: fx.Tool; ms: number; at: number; sfx: Sfx }> = {
  whipped: { tool: "whipper", ms: 900, at: 350, sfx: "pour" },
  caramel_drizzle: { tool: "bottle", ms: 1000, at: 250, sfx: "pump" },
  choco_drizzle: { tool: "bottle", ms: 1000, at: 250, sfx: "pump" },
  cocoa: { tool: "shaker", ms: 800, at: 300, sfx: "tick" },
};

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

export default function Builder({ preset }: { preset?: string }) {
  const router = useRouter();
  const { config: c, name, step, editingId, patch, pickBase, setName, setStep, reset, loadPreset } = useBuilder();
  const addToCart = useCart((s) => s.add);
  const updateCart = useCart((s) => s.update);
  const [added, setAdded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const [brewing, setBrewing] = useState(false);
  const [serve, setServe] = useState<"idle" | "stir" | "lid" | "slide">("idle");
  const cupCtl = useAnimation();
  const pendingTop = useRef(new Set<string>());
  const cupRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (preset) loadPreset(preset); }, [preset, loadPreset]);

  const base = BASE_MAP[c.base];
  const stats = calcStats(c);
  const cents = unitPrice(c);
  const error = validateConfig(c);
  const finalName = name.trim() || defaultName(c);
  const last = step === STEPS.length - 1;

  // ---- actions shared by tap / hold / keyboard / drag-and-drop ----
  const say = (m: string) => setMsg(m);
  const bump = () => { void cupCtl.start({ rotate: [0, -2.5, 2.5, 0], scale: [1, 1.035, 1], transition: { duration: 0.35 } }); };
  const cheer = (cents: number, up = true, delay = 0) => {
    fx.floatText(cents ? `${up ? "+" : "−"}${fmt(cents)}` : up ? "Free!" : "Removed", !up, delay);
    fx.haptic(up ? 14 : 8);
    bump();
  };

  // Milk: a pitcher swings over the cup and pours; the cup fills while it pours.
  const setMilk = (id: string) => {
    if (cur().milk === id) { play("tap"); return; }
    if (id === "none") { patch({ milk: id }); play("tap"); say("No milk"); bump(); return; }
    const m = MILK_MAP[id];
    play("pour");
    fx.pourFor("milk", m.color, "pitcher", 1000);
    setTimeout(() => patch({ milk: id }), 300);
    cheer(m.price, true, 400);
    say(`${m.name} milk selected`);
  };

  // Espresso: hold the button, shots drip into the cup (one per ~second).
  const addShot = () => {
    const n = cur().shots;
    if (n >= 4) { fx.floatText("Cup's full of shots!", true); return false; }
    patch({ shots: n + 1 });
    play(n === 0 ? "drop" : "tick");
    cheer(SHOT_PRICE);
    say(`Espresso shots: ${n + 1}`);
    return true;
  };
  const removeShot = () => { const n = cur().shots; if (n <= 0) return; patch({ shots: n - 1 }); play("tap"); cheer(SHOT_PRICE, false); say(`Espresso shots: ${n - 1}`); };
  const startBrew = () => { setBrewing(true); play("pour"); fx.streamOn("espresso", "#4a2c18", "nozzle"); };
  const stopBrew = () => { setBrewing(false); fx.release("espresso", 450); };

  // Matcha: a scoop flies from the button into the cup.
  const addMatcha = (from?: Element | null) => {
    const n = cur().matcha;
    if (n >= 3) { fx.floatText("Max scoops", true); return; }
    patch({ matcha: n + 1 });
    play("drop");
    if (from) fx.fly("🥄", from, "#7a9e5a"); else fx.burst("#7a9e5a");
    cheer(MATCHA_PRICE, true, from ? 600 : 0);
    say(`Matcha scoops: ${n + 1}`);
  };
  const removeMatcha = () => { const n = cur().matcha; if (n <= 0) return; patch({ matcha: n - 1 }); play("tap"); cheer(MATCHA_PRICE, false); say(`Matcha scoops: ${n - 1}`); };

  // Syrups: press (or hold) the bottle pump, a drip falls into the cup.
  const pump = (id: string) => {
    const n = cur().syrups[id] ?? 0;
    if (n >= 5) { fx.floatText("Max pumps", true); return false; }
    patch({ syrups: { ...cur().syrups, [id]: n + 1 } });
    play("pump");
    fx.drip(SYRUP_COLOR[id] ?? "#c68642");
    cheer(SYRUP_MAP[id].price, true, 330);
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

  // Toppings: they fly into the cup (tap again to take them off).
  const toggleTopping = (id: string, mode: "toggle" | "add" = "toggle", from?: Element | null) => {
    if (pendingTop.current.has(id)) return;
    const t = TOPPING_MAP[id];
    const on = cur().toppings.includes(id);
    if (on && mode === "add") { fx.floatText("Already on!", true); return; }
    if (on) {
      patch({ toppings: cur().toppings.filter((x) => x !== id) });
      play("tap"); cheer(t.price, false); say(`${t.name} removed`);
      return;
    }
    const add = () => { const l = cur().toppings; patch({ toppings: l.includes(id) ? l : [...l, id] }); pendingTop.current.delete(id); };
    const d = DISPENSE[id];
    if (d) {
      // squirt / drizzle / shake it on: the cup builds up while the tool is running
      pendingTop.current.add(id);
      play(d.sfx);
      fx.pourFor(`top-${id}`, TOP_COLOR[id] ?? "#c68642", d.tool, d.ms);
      setTimeout(add, d.at);
      cheer(t.price, true, d.at + 150);
    } else if (from) {
      play("drop");
      pendingTop.current.add(id);
      fx.fly(`art:${id}`, from, TOP_COLOR[id] ?? "#c68642");
      setTimeout(add, 430);
      cheer(t.price, true, 600);
    } else { play("drop"); add(); fx.burst(TOP_COLOR[id] ?? "#c68642"); cheer(t.price); }
    say(`${t.name} added`);
  };

  // Serve it: stir, put the lid on (open-top drinks with toppings stay open), ring the bell, slide it across the counter.
  async function finish() {
    if (error || serve !== "idle") return;
    const cfg = structuredClone(c);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm) {
      setServe("stir");
      play("pour");
      void cupCtl.start({ rotate: [0, -3, 3, -3, 3, 0], y: [0, -5, 0, -5, 0], transition: { duration: 1 } });
      await sleep(1000);
      if (cfg.toppings.length === 0) { setServe("lid"); play("tap"); await sleep(550); }
      setServe("slide");
      play("ding");
      fx.haptic(30);
      ["#c68642", "#7a9e5a", "#b5446e", "#fffdf8"].forEach((col, i) => fx.burst(col, i * 90));
      await cupCtl.start({ x: 480, rotate: 8, opacity: 0, transition: { duration: 0.6, ease: "easeIn" } });
    }
    play("chime");
    if (editingId) { updateCart(editingId, finalName, cfg); reset(); router.push("/cart"); return; }
    addToCart(finalName, cfg);
    setAdded(true);
  }
  // Bring the cup back for the next drink.
  const nextDrink = () => { cupCtl.set({ x: 0, y: 0, rotate: 0, opacity: 1 }); setServe("idle"); reset(); setAdded(false); };

  const dnd = { cupRef, onActive: setDragging };

  return (
    <div className="overflow-x-clip pb-28">
      <FxLayer />
      <p className="sr-only" aria-live="polite">{msg}</p>
      <ol className="mb-5 flex gap-1.5 overflow-x-auto" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => { play("tap"); setStep(i); }} aria-current={i === step ? "step" : undefined} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${i === step ? "bg-espresso text-cream" : i < step ? "bg-caramel/20" : "bg-surface"}`}>{i + 1}. {s}</button>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="sticky top-[4.75rem] z-20 bg-cream pb-2 lg:top-[5.5rem] lg:self-start lg:pb-0">
          <motion.div ref={cupRef} data-cup animate={cupCtl} className={`card grid place-items-center bg-gradient-to-b from-milk to-surface !p-3 lg:!p-5 ${dragging ? "ring-4 ring-caramel ring-offset-2 ring-offset-cream" : ""}`}>
            <Cup config={c} live lid={serve === "lid" || serve === "slide"} stir={serve === "stir"} className="h-36 lg:h-72" />
            <p className="hidden font-display text-lg font-bold lg:block">{finalName}</p>
            <div className="mt-1 lg:hidden"><StatChips s={stats} /></div>
            {dragging && <p className="text-sm font-semibold text-caramel">Drop it on the cup!</p>}
          </motion.div>
          <div className="card mt-4 hidden lg:block"><StatsPanel s={stats} /></div>
        </aside>

        <section className="min-w-0">
          {step === 0 && (
            <div><h2 className="mb-3 text-2xl font-bold">Pick your base</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {BASES.map((b) => (
                  <button key={b.id} aria-pressed={c.base === b.id} className={choice(c.base === b.id)} onClick={() => { play("tap"); pickBase(b.id); say(`${b.name} selected`); }}>
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
                    <button key={s} aria-pressed={c.size === s} className={choice(c.size === s)} onClick={() => { play("tap"); patch({ size: s }); }}>
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
                      <button key={t} disabled={!ok} aria-pressed={c.temp === t} className={`${choice(c.temp === t)} disabled:opacity-40`} onClick={() => { play("tap"); patch({ temp: t }); }}>
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
              <p className="text-sm opacity-70">Press and hold the button to pull shots, about one per second. Or drag a card&apos;s ⠿ handle onto the cup.</p>
              <Drag {...dnd} onDrop={() => { addShot(); }}>
                <div className="card !pr-12">
                  <h2 className="text-2xl font-bold">Espresso shots</h2>
                  <p className="text-sm opacity-70">{fmt(SHOT_PRICE)} each · ~63 mg caffeine</p>
                  <EspressoMachine brewing={brewing} />
                  <div className="mt-3 flex items-center gap-3">
                    <HoldButton label="Hold to brew espresso" fire={addShot} interval={950} onStart={startBrew} onStop={stopBrew} className="btn-accent !min-h-14 flex-1 text-lg">☕ Hold to brew</HoldButton>
                    <button type="button" className="btn-ghost h-14 w-14 shrink-0 !p-0 text-xl" aria-label="Remove a shot" disabled={c.shots <= 0} onClick={removeShot}>↩</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between"><Pips n={c.shots} max={4} /><span className="text-sm font-semibold">{c.shots} shot{c.shots === 1 ? "" : "s"}</span></div>
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
                  <div className="mt-3 flex items-center justify-between"><Pips n={c.matcha} max={3} color="bg-matcha" /><span className="text-sm font-semibold">{c.matcha} scoop{c.matcha === 1 ? "" : "s"}</span></div>
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
                      <PitcherIcon color={m.id === "none" ? "transparent" : m.color} className="mb-1 h-12 w-12" />
                      <div className="font-bold">{m.name}</div><div className="text-sm opacity-70">{m.price ? `+${fmt(m.price)}` : "Free"}</div>
                    </button>
                  </Drag>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div><h2 className="mb-1 text-2xl font-bold">Sweeten it up</h2><p className="mb-3 text-sm opacity-70">Press a bottle to pump (hold to keep pumping), up to 5 each. Or drag a ⠿ handle onto the cup.</p>
              <div className="space-y-3">
                {SYRUPS.map((s) => (
                  <Drag key={s.id} {...dnd} onDrop={() => { pump(s.id); }}>
                    <SyrupRow name={`${s.emoji} ${s.name}`} price={s.price ? `${fmt(s.price)} / pump` : "Free"} color={SYRUP_COLOR[s.id] ?? "#c68642"} n={c.syrups[s.id] ?? 0} max={5} pump={() => pump(s.id)} unpump={() => unpump(s.id)} />
                  </Drag>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div><h2 className="mb-1 text-2xl font-bold">Top it off</h2><p className="mb-3 text-sm opacity-70">Tap a topping and it flies into the cup. Tap again to take it off, or drag a ⠿ handle onto the cup.</p>
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
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div><div className="text-xs opacity-60">Total</div><div className="font-display text-2xl font-bold">{fmt(cents)}</div></div>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={step === 0} onClick={() => { play("tap"); setStep(step - 1); }}>Back</button>
            {last ? <button className="btn-accent" disabled={!!error || serve !== "idle"} onClick={() => void finish()}>{serve !== "idle" ? "Serving…" : editingId ? "Update basket" : "Add to basket"}</button>
              : <button className="btn-primary" onClick={() => { play("tap"); setStep(step + 1); }}>Next</button>}
          </div>
        </div>
      </div>

      {added && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-espresso/40 p-4" role="dialog" aria-modal="true">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-sm text-center">
            <div className="text-4xl">🎉</div><h2 className="mt-2 text-2xl font-bold">Added to basket!</h2><p className="mb-4 text-sm opacity-70">{finalName} is ready. Build another?</p>
            <div className="grid gap-2">
              <button className="btn-accent" onClick={nextDrink}>Build another</button>
              <Link href="/cart" onClick={() => { cupCtl.set({ x: 0, y: 0, rotate: 0, opacity: 1 }); setServe("idle"); reset(); }} className="btn-primary">View basket</Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
