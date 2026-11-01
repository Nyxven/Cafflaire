// Taste preferences collected by onboarding, plus the logic that turns them into drink picks.
// Client-safe (no database imports) so the onboarding screen can preview results instantly.
import { z } from "zod";
import {
  BASE_MAP, Config, MILK_MAP, PRESETS, Preset, SYRUP_MAP, TOPPING_MAP, Temp,
  calcStats, unitPrice, validateConfig,
} from "./catalog";

export const CATEGORIES = ["Coffee", "Frappe", "Matcha"] as const;
export const TEMPS = ["hot", "iced", "blended"] as const;
export const CAFFEINE = ["light", "balanced", "strong"] as const;
export const SWEETNESS = ["none", "light", "sweet", "very"] as const;
export const MILK_CHOICES = ["whole", "oat", "almond", "soy", "coconut", "none"] as const;

export const prefsSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).min(1).max(3),
  temps: z.array(z.enum(TEMPS)).min(1).max(3),
  caffeine: z.enum(CAFFEINE),
  sweetness: z.enum(SWEETNESS),
  milk: z.enum(MILK_CHOICES),
  avoidNuts: z.boolean(),
  vegan: z.boolean(),
});
export type Prefs = z.infer<typeof prefsSchema>;

export const DEFAULT_PREFS: Prefs = {
  categories: ["Coffee"], temps: ["hot", "iced"], caffeine: "balanced", sweetness: "light", milk: "whole", avoidNuts: false, vegan: false,
};

/** Resolves conflicts (a nut allergy can't pick almond milk; vegan can't pick dairy milk). */
export function normalize(p: Prefs): Prefs {
  let milk = p.milk;
  if (p.avoidNuts && milk === "almond") milk = "oat";
  if (p.vegan && (milk === "whole")) milk = "oat";
  return { ...p, milk };
}

export const LABELS = {
  category: { Coffee: "Coffee", Frappe: "Frappe", Matcha: "Matcha" } as Record<string, string>,
  temp: { hot: "Hot", iced: "Iced", blended: "Blended" } as Record<Temp, string>,
  caffeine: { light: "Gentle caffeine", balanced: "Balanced caffeine", strong: "Strong caffeine" } as Record<Prefs["caffeine"], string>,
  sweetness: { none: "Unsweetened", light: "Lightly sweet", sweet: "Sweet", very: "Extra sweet" } as Record<Prefs["sweetness"], string>,
  milk: { whole: "Whole milk", oat: "Oat milk", almond: "Almond milk", soy: "Soy milk", coconut: "Coconut milk", none: "No milk" } as Record<Prefs["milk"], string>,
};

/** Short, human-readable summary chips for a person's taste profile. */
export function describePrefs(p: Prefs): string[] {
  const out = [
    ...p.categories,
    ...p.temps.map((t) => LABELS.temp[t]),
    LABELS.caffeine[p.caffeine],
    LABELS.sweetness[p.sweetness],
    LABELS.milk[p.milk],
  ];
  if (p.vegan) out.push("Vegan");
  if (p.avoidNuts) out.push("Nut-free");
  return out;
}

const SWEET_TARGET: Record<Prefs["sweetness"], number> = { none: 1, light: 2, sweet: 3, very: 4 };

/** Adapts any drink to a person's tastes and dietary needs. Falls back to the original if the result isn't valid. */
export function personalise(original: Config, input: Prefs): Config {
  const p = normalize(input);
  const c: Config = structuredClone(original);
  const base = BASE_MAP[c.base];

  // Temperature: keep it if liked, otherwise use the first liked temperature this drink can be made at.
  if (!p.temps.includes(c.temp)) {
    const t = p.temps.find((x) => base.temps.includes(x));
    if (t) c.temp = t;
  }

  // Caffeine
  if (p.caffeine === "light") { c.shots = Math.min(c.shots, 1); c.matcha = Math.min(c.matcha, 1); }
  if (p.caffeine === "strong") { if (c.shots > 0) c.shots = 3; if (c.matcha > 0) c.matcha = 3; }
  if (c.shots + c.matcha < 1) c.shots = 1;

  // Milk
  if (c.milk !== "none") {
    let milk = p.milk === "none" ? c.milk : p.milk;
    if (p.vegan && MILK_MAP[milk].dairy) milk = "oat";
    if (p.avoidNuts && MILK_MAP[milk].nuts) milk = "oat";
    c.milk = milk;
  }

  // Sweeteners
  const next: Record<string, number> = {};
  for (const [id, n] of Object.entries(c.syrups)) {
    const s = SYRUP_MAP[id];
    if (!s || n <= 0) continue;
    if ((p.vegan && !s.vegan) || (p.avoidNuts && s.nuts)) continue;
    next[id] = p.sweetness === "none" ? 0 : p.sweetness === "light" ? Math.min(n, 1) : p.sweetness === "very" ? Math.min(5, n + 1) : n;
  }
  if (p.sweetness === "sweet" && Object.values(next).every((n) => !n) && base.sugar < 10) next.vanilla = 1;
  if (p.sweetness === "very" && Object.values(next).every((n) => !n)) next.caramel = 2;
  c.syrups = Object.fromEntries(Object.entries(next).filter(([, n]) => n > 0));

  // Toppings
  c.toppings = c.toppings.filter((id) => {
    const t = TOPPING_MAP[id];
    if (!t) return false;
    if (p.vegan && (!t.vegan || t.dairy)) return false;
    if (p.sweetness === "none" && t.sugar > 0) return false;
    return true;
  });

  return validateConfig(c) === null ? c : original;
}

export interface Pick { preset: Preset; config: Config; name: string; cents: number; score: number }

function score(preset: Preset, config: Config, input: Prefs): number {
  const p = normalize(input);
  const st = calcStats(config);
  let s = 0;
  if ((p.categories as readonly string[]).includes(preset.category)) s += 4;
  if (p.temps.includes(config.temp)) s += 2;
  s -= Math.abs(st.sweetness - SWEET_TARGET[p.sweetness]);
  if (p.milk === "none") s += config.milk === "none" ? 2 : -1;
  if (p.caffeine === "light" && st.caffeineMg > 70) s -= 1;
  if (p.caffeine === "strong" && st.caffeineMg < 120) s -= 1;
  return s;
}

/** Best-matching drinks for a taste profile, best first. Always returns every preset ranked. */
export function rankPicks(p: Prefs): Pick[] {
  return PRESETS.map((preset, i) => {
    const config = personalise(preset.config, p);
    return { preset, config, name: preset.name, cents: unitPrice(config), score: score(preset, config, p) - i * 0.001 };
  }).sort((a, b) => b.score - a.score);
}

/** Plain-language reasons a drink suits someone ("Iced, the way you like it"). */
export function reasonsFor(pick: Pick, p: Prefs): string[] {
  const c = pick.config;
  const st = calcStats(c);
  const out: string[] = [];
  if ((p.categories as readonly string[]).includes(pick.preset.category)) out.push(`${pick.preset.category} is your kind of drink`);
  out.push(c.temp === "hot" ? "Served hot" : c.temp === "iced" ? "Served over ice" : "Blended smooth");
  out.push(`${st.caffeineMg} mg caffeine`);
  if (c.milk !== "none") out.push(`Made with ${LABELS.milk[c.milk as Prefs["milk"]]?.toLowerCase() ?? c.milk + " milk"}`);
  if (p.vegan) out.push("Vegan-friendly");
  if (p.avoidNuts) out.push("No nuts");
  return out.slice(0, 5);
}

