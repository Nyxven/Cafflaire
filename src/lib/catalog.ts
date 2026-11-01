// Single source of truth for ingredients, pricing and stats.
// Used by the client preview AND the server (orders are always re-priced server-side).
// All money is integer centavos. Nutrition/caffeine values are approximations.

export type Size = "s" | "m" | "l";
export type Temp = "hot" | "iced" | "blended";

export interface Config {
  base: string;
  size: Size;
  temp: Temp;
  shots: number; // espresso shots 0-4
  matcha: number; // matcha scoops 0-3
  milk: string; // milk id or "none"
  syrups: Record<string, number>; // syrup/sweetener id -> pumps 0-5
  toppings: string[];
}

export interface OrderItem {
  name: string;
  qty: number;
  config: Config;
  unitCents: number;
  stats: Stats;
}

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "PHP";
export const DELIVERY_FEE_CENTS = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE_CENTS ?? 5000);
export const fmt = (cents: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: CURRENCY }).format(cents / 100);

export const SIZES: Record<Size, { label: string; oz: number; up: number; mult: number; fill: number }> = {
  s: { label: "Small", oz: 12, up: 0, mult: 1, fill: 0.72 },
  m: { label: "Medium", oz: 16, up: 2000, mult: 1.3, fill: 0.86 },
  l: { label: "Large", oz: 22, up: 4000, mult: 1.7, fill: 1 },
};

export const SHOT_PRICE = 3500;
export const SHOT_CAFFEINE = 63;
export const MATCHA_PRICE = 3000;
export const MATCHA_CAFFEINE = 35;

export interface Base {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  sugar: number;
  cal: number;
  temps: Temp[];
  milkRatio: number;
  defaults: { temp: Temp; shots: number; matcha: number; milk: string };
}

export const BASES: Base[] = [
  { id: "latte", name: "Latte", emoji: "☕", desc: "Smooth espresso with steamed milk", price: 6000, sugar: 0, cal: 10, temps: ["hot", "iced"], milkRatio: 0.65, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "whole" } },
  { id: "cappuccino", name: "Cappuccino", emoji: "🫖", desc: "Espresso, milk and thick foam", price: 6000, sugar: 0, cal: 10, temps: ["hot"], milkRatio: 0.5, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "whole" } },
  { id: "americano", name: "Americano", emoji: "🥃", desc: "Espresso topped with water", price: 5000, sugar: 0, cal: 5, temps: ["hot", "iced"], milkRatio: 0.2, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "none" } },
  { id: "mocha", name: "Mocha", emoji: "🍫", desc: "Chocolatey espresso with milk", price: 7000, sugar: 10, cal: 60, temps: ["hot", "iced"], milkRatio: 0.6, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "whole" } },
  { id: "icedcoffee", name: "Iced Coffee", emoji: "🧊", desc: "Cold, bold and refreshing", price: 5500, sugar: 0, cal: 5, temps: ["iced"], milkRatio: 0.4, defaults: { temp: "iced", shots: 2, matcha: 0, milk: "whole" } },
  { id: "frappe", name: "Frappe", emoji: "🥤", desc: "Blended, icy and creamy", price: 9000, sugar: 15, cal: 100, temps: ["blended"], milkRatio: 0.75, defaults: { temp: "blended", shots: 1, matcha: 0, milk: "whole" } },
  { id: "matcha", name: "Matcha Latte", emoji: "🍵", desc: "Ceremonial-style matcha with milk", price: 8000, sugar: 4, cal: 20, temps: ["hot", "iced"], milkRatio: 0.65, defaults: { temp: "hot", shots: 0, matcha: 2, milk: "whole" } },
  { id: "flatwhite", name: "Flat White", emoji: "🥛", desc: "Strong espresso, silky microfoam", price: 6500, sugar: 0, cal: 10, temps: ["hot"], milkRatio: 0.5, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "whole" } },
  { id: "macchiato", name: "Macchiato", emoji: "🍮", desc: "Espresso marked with a spoon of foam", price: 5500, sugar: 0, cal: 8, temps: ["hot", "iced"], milkRatio: 0.25, defaults: { temp: "hot", shots: 2, matcha: 0, milk: "whole" } },
  { id: "coldbrew", name: "Cold Brew", emoji: "🫗", desc: "Slow-steeped, smooth and strong", price: 6500, sugar: 0, cal: 5, temps: ["iced"], milkRatio: 0.2, defaults: { temp: "iced", shots: 2, matcha: 0, milk: "none" } },
  { id: "spanish", name: "Spanish Latte", emoji: "🍯", desc: "Espresso with sweet condensed milk", price: 7000, sugar: 12, cal: 70, temps: ["hot", "iced"], milkRatio: 0.65, defaults: { temp: "iced", shots: 2, matcha: 0, milk: "whole" } },
];

export interface Milk { id: string; name: string; price: number; sugar: number; cal: number; color: string; dairy: boolean; nuts: boolean }
export const MILKS: Milk[] = [
  { id: "none", name: "No milk", price: 0, sugar: 0, cal: 0, color: "#f3e5d0", dairy: false, nuts: false },
  { id: "whole", name: "Whole", price: 0, sugar: 10, cal: 110, color: "#f5ebdc", dairy: true, nuts: false },
  { id: "skim", name: "Skim", price: 0, sugar: 11, cal: 70, color: "#f8f5ef", dairy: true, nuts: false },
  { id: "oat", name: "Oat", price: 3000, sugar: 7, cal: 120, color: "#ead9b8", dairy: false, nuts: false },
  { id: "almond", name: "Almond", price: 3000, sugar: 4, cal: 60, color: "#efe2cc", dairy: false, nuts: true },
  { id: "soy", name: "Soy", price: 2500, sugar: 6, cal: 90, color: "#f0e6c8", dairy: false, nuts: false },
  { id: "coconut", name: "Coconut", price: 3000, sugar: 5, cal: 80, color: "#f6f1e6", dairy: false, nuts: false },
  { id: "lactosefree", name: "Lactose-free", price: 2000, sugar: 8, cal: 100, color: "#f6eedf", dairy: true, nuts: false },
  { id: "macadamia", name: "Macadamia", price: 3500, sugar: 2, cal: 70, color: "#f1e5d1", dairy: false, nuts: true },
  { id: "condensed", name: "Condensed milk", price: 1500, sugar: 18, cal: 130, color: "#f3e2bd", dairy: true, nuts: false },
];

export interface Syrup { id: string; name: string; emoji: string; price: number; sugar: number; cal: number; vegan: boolean; nuts: boolean }
export const SYRUPS: Syrup[] = [
  { id: "sugar", name: "White sugar", emoji: "🧂", price: 0, sugar: 4, cal: 16, vegan: true, nuts: false },
  { id: "brown", name: "Brown sugar", emoji: "🟤", price: 1000, sugar: 5, cal: 20, vegan: true, nuts: false },
  { id: "honey", name: "Honey", emoji: "🍯", price: 1500, sugar: 5, cal: 20, vegan: false, nuts: false },
  { id: "vanilla", name: "Vanilla", emoji: "🌼", price: 2000, sugar: 5, cal: 20, vegan: true, nuts: false },
  { id: "caramel", name: "Caramel", emoji: "🍮", price: 2000, sugar: 5, cal: 22, vegan: true, nuts: false },
  { id: "hazelnut", name: "Hazelnut", emoji: "🌰", price: 2000, sugar: 5, cal: 20, vegan: true, nuts: true },
  { id: "mocha", name: "Mocha sauce", emoji: "🍫", price: 2500, sugar: 5, cal: 25, vegan: true, nuts: false },
  { id: "ube", name: "Ube", emoji: "🟣", price: 2500, sugar: 5, cal: 22, vegan: true, nuts: false },
  { id: "pandan", name: "Pandan", emoji: "🌿", price: 2500, sugar: 5, cal: 20, vegan: true, nuts: false },
  { id: "saltedcaramel", name: "Salted caramel", emoji: "🥨", price: 2500, sugar: 5, cal: 24, vegan: true, nuts: false },
  { id: "cinnamon", name: "Cinnamon", emoji: "🍂", price: 2000, sugar: 4, cal: 18, vegan: true, nuts: false },
  { id: "pumpkin", name: "Pumpkin spice", emoji: "🎃", price: 2500, sugar: 5, cal: 22, vegan: true, nuts: false },
  { id: "peppermint", name: "Peppermint", emoji: "🍬", price: 2000, sugar: 5, cal: 20, vegan: true, nuts: false },
];

export interface Topping { id: string; name: string; emoji: string; price: number; sugar: number; cal: number; vegan: boolean; dairy: boolean }
export const TOPPINGS: Topping[] = [
  { id: "whipped", name: "Whipped cream", emoji: "☁️", price: 2500, sugar: 2, cal: 60, vegan: false, dairy: true },
  { id: "caramel_drizzle", name: "Caramel drizzle", emoji: "〰️", price: 1500, sugar: 5, cal: 25, vegan: true, dairy: false },
  { id: "choco_drizzle", name: "Choco drizzle", emoji: "🍫", price: 1500, sugar: 4, cal: 25, vegan: true, dairy: false },
  { id: "cocoa", name: "Cocoa dust", emoji: "✨", price: 1000, sugar: 0, cal: 5, vegan: true, dairy: false },
  { id: "cookie", name: "Cookie crumbs", emoji: "🍪", price: 2000, sugar: 4, cal: 40, vegan: true, dairy: false },
  { id: "marshmallow", name: "Marshmallows", emoji: "🤍", price: 2000, sugar: 6, cal: 30, vegan: false, dairy: false },
  { id: "coldfoam", name: "Cold foam", emoji: "🫧", price: 2000, sugar: 2, cal: 30, vegan: false, dairy: true },
  { id: "cinnamon_dust", name: "Cinnamon dust", emoji: "🍂", price: 1000, sugar: 0, cal: 3, vegan: true, dairy: false },
  { id: "chips", name: "Dark choco chips", emoji: "🍫", price: 2000, sugar: 4, cal: 45, vegan: true, dairy: false },
  { id: "pearls", name: "Tapioca pearls", emoji: "⚫", price: 2500, sugar: 8, cal: 70, vegan: true, dairy: false },
  { id: "sprinkles", name: "Rainbow sprinkles", emoji: "🌈", price: 1500, sugar: 4, cal: 20, vegan: true, dairy: false },
];

const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;
export const BASE_MAP = byId(BASES);
export const MILK_MAP = byId(MILKS);
export const SYRUP_MAP = byId(SYRUPS);
export const TOPPING_MAP = byId(TOPPINGS);

export function defaultConfig(baseId = "latte"): Config {
  const b = BASE_MAP[baseId];
  return { base: b.id, size: "m", temp: b.defaults.temp, shots: b.defaults.shots, matcha: b.defaults.matcha, milk: b.defaults.milk, syrups: {}, toppings: [] };
}

const isInt = (n: unknown, min: number, max: number) => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;

/** Returns an error message, or null if the config is a valid drink. */
export function validateConfig(c: Config): string | null {
  const b = BASE_MAP[c.base];
  if (!b) return "Pick a base drink";
  if (!SIZES[c.size]) return "Pick a size";
  if (!b.temps.includes(c.temp)) return `${b.name} can't be made ${c.temp}`;
  if (!isInt(c.shots, 0, 4)) return "Shots must be 0-4";
  if (!isInt(c.matcha, 0, 3)) return "Matcha scoops must be 0-3";
  if (!MILK_MAP[c.milk]) return "Unknown milk";
  for (const [id, n] of Object.entries(c.syrups)) {
    if (!SYRUP_MAP[id]) return "Unknown sweetener";
    if (!isInt(n, 0, 5)) return "Pumps must be 0-5";
  }
  if (new Set(c.toppings).size !== c.toppings.length || c.toppings.some((t) => !TOPPING_MAP[t])) return "Invalid toppings";
  if (c.shots + c.matcha < 1) return "Add at least 1 espresso shot or matcha scoop";
  return null;
}

export interface PriceLine { label: string; cents: number }

export function priceLines(c: Config): PriceLine[] {
  const b = BASE_MAP[c.base];
  const lines: PriceLine[] = [{ label: b.name, cents: b.price }];
  const s = SIZES[c.size];
  if (s.up) lines.push({ label: `${s.label} size`, cents: s.up });
  if (c.shots) lines.push({ label: `Espresso ×${c.shots}`, cents: c.shots * SHOT_PRICE });
  if (c.matcha) lines.push({ label: `Matcha ×${c.matcha}`, cents: c.matcha * MATCHA_PRICE });
  const m = MILK_MAP[c.milk];
  if (m.price) lines.push({ label: `${m.name} milk`, cents: m.price });
  for (const [id, n] of Object.entries(c.syrups)) {
    const sy = SYRUP_MAP[id];
    if (n > 0 && sy.price) lines.push({ label: `${sy.name} ×${n}`, cents: n * sy.price });
  }
  for (const t of c.toppings) lines.push({ label: TOPPING_MAP[t].name, cents: TOPPING_MAP[t].price });
  return lines;
}

export const unitPrice = (c: Config) => priceLines(c).reduce((a, l) => a + l.cents, 0);

export interface Stats {
  caffeineMg: number;
  caffeineLevel: "None" | "Low" | "Medium" | "High" | "Very high";
  sugarG: number;
  sweetness: 1 | 2 | 3 | 4 | 5;
  calories: number;
  oz: number;
  tags: string[];
}

export function calcStats(c: Config): Stats {
  const b = BASE_MAP[c.base];
  const m = MILK_MAP[c.milk];
  const mult = SIZES[c.size].mult;
  let sugar = (b.sugar + m.sugar) * mult;
  let cal = (b.cal + m.cal) * mult + c.shots * 2 + c.matcha * 10;
  let vegan = !m.dairy;
  let dairy = m.dairy;
  let nuts = m.nuts;
  for (const [id, n] of Object.entries(c.syrups)) {
    const s = SYRUP_MAP[id];
    if (!s || n <= 0) continue;
    sugar += n * s.sugar;
    cal += n * s.cal;
    vegan &&= s.vegan;
    nuts ||= s.nuts;
  }
  for (const t of c.toppings) {
    const tp = TOPPING_MAP[t];
    if (!tp) continue;
    sugar += tp.sugar;
    cal += tp.cal;
    vegan &&= tp.vegan;
    dairy ||= tp.dairy;
  }
  const caffeineMg = c.shots * SHOT_CAFFEINE + c.matcha * MATCHA_CAFFEINE;
  const caffeineLevel = caffeineMg === 0 ? "None" : caffeineMg < 50 ? "Low" : caffeineMg <= 150 ? "Medium" : caffeineMg <= 300 ? "High" : "Very high";
  const sweetness = (sugar <= 5 ? 1 : sugar <= 15 ? 2 : sugar <= 25 ? 3 : sugar <= 40 ? 4 : 5) as Stats["sweetness"];
  const tags: string[] = [];
  if (!dairy) tags.push("Dairy-free");
  if (vegan) tags.push("Vegan-friendly");
  if (nuts) tags.push("Contains nuts");
  return { caffeineMg, caffeineLevel, sugarG: Math.round(sugar), sweetness, calories: Math.round(cal), oz: SIZES[c.size].oz, tags };
}

export interface Preset { slug: string; name: string; category: "Coffee" | "Frappe" | "Matcha" | "Specialty"; desc: string; config: Config }
const P = (base: string, o: Partial<Config> = {}): Config => ({ ...defaultConfig(base), ...o });
export const PRESETS: Preset[] = [
  { slug: "caffe-latte", name: "Caffè Latte", category: "Coffee", desc: "Classic double-shot latte", config: P("latte") },
  { slug: "cappuccino", name: "Cappuccino", category: "Coffee", desc: "Foamy, balanced, timeless", config: P("cappuccino") },
  { slug: "americano", name: "Americano", category: "Coffee", desc: "Bold and clean", config: P("americano") },
  { slug: "mocha-latte", name: "Mocha Latte", category: "Coffee", desc: "Chocolate meets espresso", config: P("mocha", { syrups: { mocha: 1 }, toppings: ["whipped"] }) },
  { slug: "vanilla-iced-latte", name: "Vanilla Iced Latte", category: "Coffee", desc: "Cold, creamy, lightly sweet", config: P("latte", { temp: "iced", syrups: { vanilla: 2 } }) },
  { slug: "caramel-frappe", name: "Caramel Frappe", category: "Frappe", desc: "Blended with caramel and cream", config: P("frappe", { syrups: { caramel: 2 }, toppings: ["whipped", "caramel_drizzle"] }) },
  { slug: "mocha-frappe", name: "Mocha Frappe", category: "Frappe", desc: "Icy chocolate-coffee treat", config: P("frappe", { syrups: { mocha: 2 }, toppings: ["whipped", "choco_drizzle"] }) },
  { slug: "matcha-latte", name: "Matcha Latte", category: "Matcha", desc: "Earthy and smooth", config: P("matcha") },
  { slug: "iced-matcha", name: "Iced Matcha", category: "Matcha", desc: "Refreshing oat matcha over ice", config: P("matcha", { temp: "iced", milk: "oat", syrups: { honey: 1 } }) },
  // ---- more variety (keep appended at the END: the home page picks presets by position) ----
  { slug: "flat-white", name: "Flat White", category: "Coffee", desc: "Strong, velvety and not too milky", config: P("flatwhite") },
  { slug: "macchiato", name: "Macchiato", category: "Coffee", desc: "A short, bold espresso with a touch of foam", config: P("macchiato", { size: "s" }) },
  { slug: "cold-brew", name: "Cold Brew", category: "Coffee", desc: "Slow-steeped, smooth and black", config: P("coldbrew") },
  { slug: "salted-caramel-cold-brew", name: "Salted Caramel Cold Brew", category: "Coffee", desc: "Cold brew with salted caramel and cold foam", config: P("coldbrew", { milk: "whole", syrups: { saltedcaramel: 2 }, toppings: ["coldfoam"] }) },
  { slug: "pumpkin-spice-latte", name: "Pumpkin Spice Latte", category: "Coffee", desc: "Cozy spice, whipped cream and cinnamon", config: P("latte", { syrups: { pumpkin: 2 }, toppings: ["whipped", "cinnamon_dust"] }) },
  { slug: "peppermint-mocha", name: "Peppermint Mocha", category: "Coffee", desc: "Christmas in a cup", config: P("mocha", { syrups: { mocha: 1, peppermint: 2 }, toppings: ["whipped", "choco_drizzle"] }) },
  { slug: "spanish-latte", name: "Spanish Latte", category: "Specialty", desc: "Sweet, creamy and made with condensed milk", config: P("spanish", { temp: "hot", milk: "condensed" }) },
  { slug: "iced-spanish-latte", name: "Iced Spanish Latte", category: "Specialty", desc: "The cold, sweet-and-creamy favorite", config: P("spanish", { temp: "iced", milk: "condensed" }) },
  { slug: "ube-latte", name: "Ube Latte", category: "Specialty", desc: "Purple, nutty and a little bit sweet", config: P("latte", { temp: "iced", shots: 1, syrups: { ube: 3 }, toppings: ["coldfoam"] }) },
  { slug: "pandan-latte", name: "Pandan Coconut Latte", category: "Specialty", desc: "Fragrant pandan with creamy coconut milk", config: P("latte", { temp: "iced", milk: "coconut", syrups: { pandan: 2 } }) },
  { slug: "brown-sugar-pearl-latte", name: "Brown Sugar Pearl Latte", category: "Specialty", desc: "Iced latte with chewy tapioca pearls", config: P("latte", { temp: "iced", syrups: { brown: 3 }, toppings: ["pearls"] }) },
  { slug: "cookies-cream-frappe", name: "Cookies & Cream Frappe", category: "Frappe", desc: "Blended with cookie crumbs and whipped cream", config: P("frappe", { syrups: { vanilla: 1 }, toppings: ["whipped", "cookie"] }) },
  { slug: "java-chip-frappe", name: "Java Chip Frappe", category: "Frappe", desc: "Chocolate chips, mocha and a mountain of cream", config: P("frappe", { syrups: { mocha: 2 }, toppings: ["whipped", "chips", "choco_drizzle"] }) },
  { slug: "ube-matcha", name: "Ube Matcha", category: "Matcha", desc: "Purple ube meets green matcha over ice", config: P("matcha", { temp: "iced", milk: "coconut", syrups: { ube: 2 } }) },
  { slug: "dirty-matcha", name: "Dirty Matcha", category: "Matcha", desc: "Iced matcha latte with a shot of espresso", config: P("matcha", { temp: "iced", shots: 1, matcha: 2 }) },
  { slug: "rainbow-frappe", name: "Rainbow Party Frappe", category: "Frappe", desc: "Vanilla blended with sprinkles and cream", config: P("frappe", { syrups: { vanilla: 2 }, toppings: ["whipped", "sprinkles"] }) },
];
export const PRESET_MAP = Object.fromEntries(PRESETS.map((p) => [p.slug, p]));

export const defaultName = (c: Config) => `My ${BASE_MAP[c.base]?.name ?? "Coffee"}`;

export const MIN_PREP_MINUTES = Number(process.env.NEXT_PUBLIC_MIN_PREP_MINUTES ?? 15);
// Optional store details (still undecided) — set via env, shown at checkout/orders when present.
export const STORE = {
  pickupAddress: process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? "",
  hours: process.env.NEXT_PUBLIC_STORE_HOURS ?? "",
  deliveryArea: process.env.NEXT_PUBLIC_DELIVERY_AREA ?? "",
};
