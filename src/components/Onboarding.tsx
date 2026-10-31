"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icons";
import { LogoMark } from "./Logo";
import Ring from "./Ring";
import SignatureCard from "./SignatureCard";
import { Prefs, normalize, rankPicks, reasonsFor } from "@/lib/prefs";
import { play } from "@/lib/sound";

const TOTAL = 5;

function Option({ on, onClick, role, emoji, title, hint, disabled }: { on: boolean; onClick: () => void; role: "checkbox" | "radio"; emoji: string; title: string; hint?: string; disabled?: boolean }) {
  return (
    <button type="button" role={role} aria-checked={on} disabled={disabled} onClick={() => { play("tap"); onClick(); }} className="option disabled:cursor-not-allowed disabled:opacity-40">
      <span className="text-3xl" aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span>{hint && <span className="block text-sm opacity-70">{hint}</span>}</span>
      <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-caramel bg-caramel text-white" : "border-espresso/20"}`}>
        <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}><Icon.check className="h-3.5 w-3.5" /></motion.span>}</AnimatePresence>
      </span>
    </button>
  );
}

function Switch({ on, onChange, title, hint }: { on: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { play("tap"); onChange(!on); }} className="option">
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-sm opacity-70">{hint}</span></span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-caramel" : "bg-espresso/20"}`}>
        <motion.span className="absolute top-1 h-5 w-5 rounded-full bg-white shadow" animate={{ left: on ? 24 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </span>
    </button>
  );
}

export default function Onboarding({ first, initial, redo }: { first: string; initial: Prefs | null; redo: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [cats, setCats] = useState<Prefs["categories"]>(initial?.categories ?? []);
  const [temps, setTemps] = useState<Prefs["temps"]>(initial?.temps ?? []);
  const [caffeine, setCaffeine] = useState<Prefs["caffeine"] | null>(initial?.caffeine ?? null);
  const [sweetness, setSweetness] = useState<Prefs["sweetness"] | null>(initial?.sweetness ?? null);
  const [milkPick, setMilkPick] = useState<Prefs["milk"]>(initial?.milk ?? "whole");
  const [vegan, setVegan] = useState(initial?.vegan ?? false);
  const [nuts, setNuts] = useState(initial?.avoidNuts ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); }, [step]);

  const prefs: Prefs | null = useMemo(
    () => (cats.length && temps.length && caffeine && sweetness ? normalize({ categories: cats, temps, caffeine, sweetness, milk: milkPick, vegan, avoidNuts: nuts }) : null),
    [cats, temps, caffeine, sweetness, milkPick, vegan, nuts],
  );
  const milk = prefs?.milk ?? milkPick;
  const canNext = [cats.length > 0, temps.length > 0, caffeine !== null, sweetness !== null, true][step] ?? true;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const leave = redo ? "/profile/settings" : "/home";

  async function save(body: unknown) {
    const res = await fetch("/api/prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Couldn't save your answers.");
  }

  async function skip() {
    if (redo) return router.push(leave);
    try { await save({ status: "skipped" }); } catch { /* skipping must never block the person */ }
    router.replace("/home"); router.refresh();
  }

  async function next() {
    setError("");
    if (step < TOTAL - 1) { setDir(1); setStep(step + 1); return; }
    if (!prefs) return;
    setSaving(true);
    try { await save({ status: "completed", prefs }); play("chime"); setDir(1); setStep(TOTAL); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your answers. Please try again."); }
    finally { setSaving(false); }
  }
  const back = () => { setError(""); setDir(-1); setStep(step - 1); };

  const slide = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -48 }),
  };
  const top = prefs ? rankPicks(prefs)[0] : null;
  const done = step === TOTAL;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <Link href={leave} aria-label="Cafflaire"><LogoMark className="h-10 w-10" /></Link>
        {!done && <button onClick={skip} className="rounded-full px-4 py-2 text-sm font-semibold underline-offset-4 hover:underline">{redo ? "Cancel" : "Skip for now"}</button>}
      </header>

      {!done && (
        <div className="mt-5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${TOTAL}`}>
          <div className="flex gap-1.5">{Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-espresso/10"><motion.div className="h-full origin-left rounded-full bg-caramel" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.4 }} /></div>
          ))}</div>
          <p className="mt-2 text-sm opacity-70">Step {step + 1} of {TOTAL}</p>
        </div>
      )}

      <div className="relative flex-1 py-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}>
            {step === 0 && (<>
              <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold leading-tight outline-none sm:text-5xl">What are you in the mood for?</h1>
              <p className="mb-6 mt-2 opacity-75">Hi {first}! This takes about 30 seconds. Pick as many as you like.</p>
              <div role="group" aria-label="Drink types" className="space-y-3">
                <Option role="checkbox" emoji="☕" title="Coffee" hint="Lattes, cappuccinos, americanos and more" on={cats.includes("Coffee")} onClick={() => setCats(toggle(cats, "Coffee"))} />
                <Option role="checkbox" emoji="🥤" title="Frappe" hint="Blended, icy and creamy" on={cats.includes("Frappe")} onClick={() => setCats(toggle(cats, "Frappe"))} />
                <Option role="checkbox" emoji="🍵" title="Matcha" hint="Earthy, smooth, a gentler lift" on={cats.includes("Matcha")} onClick={() => setCats(toggle(cats, "Matcha"))} />
              </div>
            </>)}

            {step === 1 && (<>
              <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold leading-tight outline-none sm:text-5xl">Hot, iced or blended?</h1>
              <p className="mb-6 mt-2 opacity-75">Choose every way you like to drink it.</p>
              <div role="group" aria-label="Temperature" className="space-y-3">
                <Option role="checkbox" emoji="🔥" title="Hot" hint="Steamy and comforting" on={temps.includes("hot")} onClick={() => setTemps(toggle(temps, "hot"))} />
                <Option role="checkbox" emoji="🧊" title="Iced" hint="Cold, bold and refreshing" on={temps.includes("iced")} onClick={() => setTemps(toggle(temps, "iced"))} />
                <Option role="checkbox" emoji="🍧" title="Blended" hint="Frosty, like a milkshake" on={temps.includes("blended")} onClick={() => setTemps(toggle(temps, "blended"))} />
              </div>
            </>)}

            {step === 2 && (<>
              <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold leading-tight outline-none sm:text-5xl">How much of a kick?</h1>
              <p className="mb-6 mt-2 opacity-75">Caffeine per drink. You can always change it when you build.</p>
              <div role="radiogroup" aria-label="Caffeine strength" className="space-y-3">
                <Option role="radio" emoji="🌱" title="Gentle" hint="About one shot or less" on={caffeine === "light"} onClick={() => setCaffeine("light")} />
                <Option role="radio" emoji="☀️" title="Balanced" hint="A couple of shots, the classic" on={caffeine === "balanced"} onClick={() => setCaffeine("balanced")} />
                <Option role="radio" emoji="⚡" title="Strong" hint="Three shots. I need it." on={caffeine === "strong"} onClick={() => setCaffeine("strong")} />
              </div>
            </>)}

            {step === 3 && (<>
              <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold leading-tight outline-none sm:text-5xl">How sweet?</h1>
              <p className="mb-6 mt-2 opacity-75">Think syrups, drizzles and toppings.</p>
              <div role="radiogroup" aria-label="Sweetness" className="space-y-3">
                <Option role="radio" emoji="🖤" title="Unsweetened" hint="Just the coffee" on={sweetness === "none"} onClick={() => setSweetness("none")} />
                <Option role="radio" emoji="🍯" title="Lightly sweet" hint="A hint of something" on={sweetness === "light"} onClick={() => setSweetness("light")} />
                <Option role="radio" emoji="🍮" title="Sweet" hint="Dessert-adjacent" on={sweetness === "sweet"} onClick={() => setSweetness("sweet")} />
                <Option role="radio" emoji="🍭" title="Extra sweet" hint="Go all in" on={sweetness === "very"} onClick={() => setSweetness("very")} />
              </div>
            </>)}

            {step === 4 && (<>
              <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold leading-tight outline-none sm:text-5xl">Milk and dietary needs</h1>
              <p className="mb-6 mt-2 opacity-75">We use this to keep unsuitable ingredients out of your picks. Optional.</p>
              <div role="radiogroup" aria-label="Preferred milk" className="grid gap-3 sm:grid-cols-2">
                {([["whole", "🥛", "Whole milk"], ["oat", "🌾", "Oat milk"], ["almond", "🌰", "Almond milk"], ["soy", "🫘", "Soy milk"], ["coconut", "🥥", "Coconut milk"], ["none", "☕", "No milk"]] as const).map(([id, e, t]) => (
                  <Option key={id} role="radio" emoji={e} title={t} on={milk === id} disabled={(id === "whole" && vegan) || (id === "almond" && nuts)} onClick={() => setMilkPick(id)} />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <Switch on={vegan} onChange={setVegan} title="I eat plant-based" hint="No dairy, honey or whipped cream" />
                <Switch on={nuts} onChange={setNuts} title="I avoid nuts" hint="No almond milk or hazelnut syrup" />
              </div>
            </>)}

            {done && top && prefs && (<>
              <div className="relative text-center">
                <Ring draw className="pointer-events-none absolute -top-6 left-1/2 h-40 w-40 -translate-x-1/2 text-caramel/40" />
                <h1 ref={heading} tabIndex={-1} className="relative text-4xl font-bold leading-tight outline-none sm:text-5xl">Meet your match, {first}.</h1>
                <p className="relative mb-6 mt-2 opacity-75">Built from your answers. We&apos;ll use them to pick drinks for you on the home page.</p>
              </div>
              <div className="card"><SignatureCard name={top.preset.name} config={top.config} reasons={reasonsFor(top, prefs)} /></div>
              <p className="mt-4 text-center text-sm opacity-70">You can change your answers any time in Settings.</p>
            </>)}
          </motion.section>
        </AnimatePresence>
      </div>

      <footer className="sticky bottom-0 -mx-4 bg-gradient-to-t from-cream via-cream/95 to-transparent px-4 pb-2 pt-6">
        <p role="alert" className="mb-2 min-h-5 text-center text-sm text-berry">{error}</p>
        {done ? (
          <button className="btn-primary w-full !min-h-12" onClick={() => { router.push(leave); router.refresh(); }}>{redo ? "Back to settings" : "Go to home"}</button>
        ) : (
          <div className="flex gap-3">
            {step > 0 && <button className="btn-ghost !min-h-12" onClick={back} disabled={saving}>Back</button>}
            <button className="btn-primary flex-1 !min-h-12" onClick={next} disabled={!canNext || saving}>{saving ? "Saving…" : step === TOTAL - 1 ? "Show me my match" : "Continue"}</button>
          </div>
        )}
      </footer>
    </main>
  );
}
