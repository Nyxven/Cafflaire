"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { useHydrated } from "@/lib/hydrated";
import { play } from "@/lib/sound";
import { useSound } from "@/lib/store";
import { Theme, applyTheme, readTheme } from "@/lib/theme";

const THEMES: { id: Theme; label: string; hint: string; icon: typeof Icon.sun }[] = [
  { id: "light", label: "Light", hint: "Bright and creamy. The default.", icon: Icon.sun },
  { id: "dark", label: "Dark", hint: "Easy on the eyes at night.", icon: Icon.moon },
  { id: "system", label: "Match my device", hint: "Follows your phone or computer.", icon: Icon.monitor },
];

export function ThemeChoice() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => setTheme(readTheme()), []);
  // While following the device, react when the device switches between light and dark.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);
  const pick = (t: Theme) => { setTheme(t); applyTheme(t); };
  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {THEMES.map(({ id, label, hint, icon: I }) => (
        <button key={id} type="button" role="radio" aria-checked={theme === id} onClick={() => pick(id)} className="option !flex-col !items-start !gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-milk"><I className="h-5 w-5" /></span>
          <span className="font-semibold">{label}</span>
          <span className="text-sm opacity-70">{hint}</span>
        </button>
      ))}
    </div>
  );
}

export function SoundSwitch() {
  const hydrated = useHydrated();
  const { muted, toggle } = useSound();
  const on = hydrated && !muted;
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { toggle(); if (!on) setTimeout(() => play("tap"), 0); }} className="option">
      <span className="min-w-0 flex-1"><span className="block font-semibold">Sound effects</span><span className="block text-sm opacity-70">Little taps and chimes while you build a drink.</span></span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-caramel" : "bg-espresso/20"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
