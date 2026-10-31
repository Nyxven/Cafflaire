"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cup from "./Cup";
import StatsPanel, { StatChips } from "./Stats";
import {
  BASES, BASE_MAP, MATCHA_PRICE, MILKS, SHOT_PRICE, SIZES, SYRUPS, TOPPINGS, Size, Temp,
  calcStats, defaultName, fmt, priceLines, unitPrice, validateConfig,
} from "@/lib/catalog";
import { useBuilder, useCart } from "@/lib/store";

const STEPS = ["Base", "Size & temp", "Shots", "Milk", "Sweeteners", "Toppings", "Review"];

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button className="btn-ghost h-11 w-11 !p-0 text-xl" aria-label={`Less ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <motion.span key={value} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="w-8 text-center text-2xl font-bold" aria-live="polite">{value}</motion.span>
      <button className="btn-ghost h-11 w-11 !p-0 text-xl" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

const choice = (on: boolean) => `rounded-2xl border-2 p-4 text-left transition active:scale-[.98] ${on ? "border-caramel bg-caramel/10" : "border-transparent bg-white hover:border-espresso/20"} shadow-soft`;

export default function Builder({ preset }: { preset?: string }) {
  const router = useRouter();
  const { config: c, name, step, editingId, patch, pickBase, setName, setStep, reset, loadPreset } = useBuilder();
  const addToCart = useCart((s) => s.add);
  const updateCart = useCart((s) => s.update);
  const [added, setAdded] = useState(false);

  useEffect(() => { if (preset) loadPreset(preset); }, [preset, loadPreset]);

  const base = BASE_MAP[c.base];
  const stats = calcStats(c);
  const cents = unitPrice(c);
  const error = validateConfig(c);
  const finalName = name.trim() || defaultName(c);
  const last = step === STEPS.length - 1;

  function finish() {
    if (error) return;
    if (editingId) { updateCart(editingId, finalName, structuredClone(c)); reset(); router.push("/cart"); return; }
    addToCart(finalName, structuredClone(c));
    setAdded(true);
  }

  return (
    <div className="pb-28">
      <ol className="mb-5 flex gap-1.5 overflow-x-auto" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${i === step ? "bg-espresso text-cream" : i < step ? "bg-caramel/20" : "bg-white"}`}>{i + 1}. {s}</button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card grid place-items-center bg-gradient-to-b from-milk to-white">
            <Cup config={c} className="h-56 lg:h-72" />
            <p className="mt-1 font-display text-lg font-bold">{finalName}</p>
            <div className="mt-2 lg:hidden"><StatChips s={stats} /></div>
          </div>
          <div className="card mt-4 hidden lg:block"><StatsPanel s={stats} /></div>
        </aside>

        <section className="min-w-0" aria-live="polite">
          {step === 0 && (
            <div><h2 className="mb-3 text-2xl font-bold">Pick your base</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {BASES.map((b) => (
                  <button key={b.id} className={choice(c.base === b.id)} onClick={() => { pickBase(b.id); }}>
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
                    <button key={s} className={choice(c.size === s)} onClick={() => patch({ size: s })}>
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
                      <button key={t} disabled={!ok} className={`${choice(c.temp === t)} disabled:opacity-40`} onClick={() => patch({ temp: t })}>
                        <div className="text-2xl">{t === "hot" ? "🔥" : t === "iced" ? "🧊" : "🌀"}</div><div className="font-bold capitalize">{t}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-sm opacity-70">Some drinks only come one way — {base.name} is available {base.temps.join(" / ")}.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="card"><h2 className="text-2xl font-bold">Espresso shots</h2><p className="mb-3 text-sm opacity-70">{fmt(SHOT_PRICE)} each · ~63 mg caffeine</p>
                <Stepper label="shots" value={c.shots} min={0} max={4} onChange={(shots) => patch({ shots })} /></div>
              <div className="card"><h2 className="text-2xl font-bold">Matcha scoops</h2><p className="mb-3 text-sm opacity-70">{fmt(MATCHA_PRICE)} each · ~35 mg caffeine</p>
                <Stepper label="scoops" value={c.matcha} min={0} max={3} onChange={(matcha) => patch({ matcha })} /></div>
              {c.shots + c.matcha < 1 && <p className="text-sm text-berry">Add at least one shot or scoop.</p>}
            </div>
          )}

          {step === 3 && (
            <div><h2 className="mb-3 text-2xl font-bold">Pick your milk</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MILKS.map((m) => (
                  <button key={m.id} className={choice(c.milk === m.id)} onClick={() => patch({ milk: m.id })}>
                    <span className="mb-2 block h-6 w-6 rounded-full border border-espresso/20" style={{ background: m.color }} />
                    <div className="font-bold">{m.name}</div><div className="text-sm opacity-70">{m.price ? `+${fmt(m.price)}` : "Free"}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div><h2 className="mb-3 text-2xl font-bold">Sweeten it up</h2><p className="mb-3 text-sm opacity-70">Up to 5 pumps each.</p>
              <div className="space-y-3">
                {SYRUPS.map((s) => (
                  <div key={s.id} className="card flex items-center justify-between !p-4">
                    <div><div className="font-bold">{s.emoji} {s.name}</div><div className="text-sm opacity-70">{s.price ? `${fmt(s.price)} / pump` : "Free"}</div></div>
                    <Stepper label={s.name} value={c.syrups[s.id] ?? 0} min={0} max={5} onChange={(n) => patch({ syrups: { ...c.syrups, [s.id]: n } })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div><h2 className="mb-3 text-2xl font-bold">Top it off</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TOPPINGS.map((t) => {
                  const on = c.toppings.includes(t.id);
                  return (
                    <button key={t.id} aria-pressed={on} className={choice(on)} onClick={() => patch({ toppings: on ? c.toppings.filter((x) => x !== t.id) : [...c.toppings, t.id] })}>
                      <div className="text-2xl">{t.emoji}</div><div className="font-bold">{t.name}</div><div className="text-sm opacity-70">+{fmt(t.price)}</div>
                    </button>
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
            <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {last ? <button className="btn-accent" disabled={!!error} onClick={finish}>{editingId ? "Update basket" : "Add to basket"}</button>
              : <button className="btn-primary" onClick={() => setStep(step + 1)}>Next</button>}
          </div>
        </div>
      </div>

      {added && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-espresso/40 p-4" role="dialog" aria-modal="true">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-sm text-center">
            <div className="text-4xl">🎉</div><h2 className="mt-2 text-2xl font-bold">Added to basket!</h2><p className="mb-4 text-sm opacity-70">{finalName} is ready. Build another?</p>
            <div className="grid gap-2">
              <button className="btn-accent" onClick={() => { reset(); setAdded(false); }}>Build another</button>
              <Link href="/cart" onClick={() => reset()} className="btn-primary">View basket</Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
