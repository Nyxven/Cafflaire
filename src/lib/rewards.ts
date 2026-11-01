// Levels, EXP and badges. Plain TypeScript (no React, no database) so it is easy to test and safe to import anywhere.
// Everything is CALCULATED from a person's orders (the server does the maths), so it can't be faked from the browser.
// Rules: cancelled orders earn nothing. Orders the person later removes from "My orders" still count (they are only hidden).
import { PRESETS, type Config, type OrderItem } from "./catalog";

/** The few facts about one order that the rewards need. */
export interface RewardOrder {
  status: string;
  fulfilment: "pickup" | "delivery";
  createdAt: Date;
  items: OrderItem[];
}

// ---------- EXP ----------
export const EXP = {
  order: 40, // every order that wasn't cancelled
  completed: 40, // extra when it was completed (picked up / delivered)
  drink: 10, // every drink in the order (capped per order)
  customDrink: 15, // extra for every drink you designed yourself
  newBase: 10, // first time you try each kind of drink
  quiz: 50, // finished the taste quiz
} as const;
const MAX_DRINKS_PER_ORDER = 10;

// ---------- Levels ----------
// Total EXP needed to REACH level n is 50 * (n - 1) * n:  L2 = 100, L3 = 300, L4 = 600, L5 = 1000, L6 = 1500 ...
export const MAX_LEVEL = 30;
export const expForLevel = (n: number) => 50 * (n - 1) * n;

export const LEVEL_TITLES: { from: number; title: string }[] = [
  { from: 1, title: "Bean Beginner" },
  { from: 3, title: "Sip Explorer" },
  { from: 5, title: "Latte Learner" },
  { from: 8, title: "Espresso Enthusiast" },
  { from: 12, title: "Brew Boss" },
  { from: 17, title: "Master Barista" },
  { from: 24, title: "Coffee Legend" },
];
export const titleFor = (level: number) => [...LEVEL_TITLES].reverse().find((t) => level >= t.from)!.title;

export interface LevelInfo {
  exp: number;
  level: number;
  title: string;
  /** EXP earned inside the current level. */
  into: number;
  /** EXP needed to go from this level to the next (0 at max level). */
  span: number;
  /** 0 to 1 progress to the next level (1 at max level). */
  pct: number;
  toNext: number;
  maxed: boolean;
}

export function levelFor(exp: number): LevelInfo {
  const e = Math.max(0, Math.floor(exp));
  let level = 1;
  while (level < MAX_LEVEL && e >= expForLevel(level + 1)) level++;
  const maxed = level >= MAX_LEVEL;
  const base = expForLevel(level);
  const span = maxed ? 0 : expForLevel(level + 1) - base;
  const into = e - base;
  return { exp: e, level, title: titleFor(level), into, span, pct: maxed ? 1 : span ? into / span : 0, toNext: maxed ? 0 : span - into, maxed };
}

// ---------- Stats gathered from orders ----------
const canonical = (c: Config) =>
  JSON.stringify([c.base, c.size, c.temp, c.shots, c.matcha, c.milk, Object.entries(c.syrups).filter(([, n]) => n > 0).sort(([a], [b]) => a.localeCompare(b)), [...c.toppings].sort()]);
const PRESET_CONFIGS = new Set(PRESETS.map((p) => canonical(p.config)));
/** A drink counts as "yours" when it is not exactly one of the menu presets. */
export const isCustomDrink = (c: Config) => !PRESET_CONFIGS.has(canonical(c));

/** Hour of day (0-23) in Manila (UTC+8, no daylight saving). */
export const manilaHour = (d: Date) => (d.getUTCHours() + 8) % 24;

export interface RewardStats {
  orders: number; // not cancelled
  completed: number;
  deliveries: number; // completed deliveries
  drinks: number; // drinks ordered (not cancelled)
  customDrinks: number;
  bases: number; // different drink types tried
  matchaDrinks: number;
  bestExtras: number; // most syrups + toppings on one drink
  maxShots: number;
  biggestOrder: number; // most drinks in one order
  nightOrders: number; // placed between 8pm and 5am Manila time
  morningOrders: number; // placed between 5am and 9am Manila time
  quiz: boolean;
}

export function gatherStats(orders: RewardOrder[], quizDone: boolean): RewardStats {
  const s: RewardStats = { orders: 0, completed: 0, deliveries: 0, drinks: 0, customDrinks: 0, bases: 0, matchaDrinks: 0, bestExtras: 0, maxShots: 0, biggestOrder: 0, nightOrders: 0, morningOrders: 0, quiz: quizDone };
  const bases = new Set<string>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    s.orders++;
    if (o.status === "completed") { s.completed++; if (o.fulfilment === "delivery") s.deliveries++; }
    const h = manilaHour(o.createdAt);
    if (h >= 20 || h < 5) s.nightOrders++;
    if (h >= 5 && h < 9) s.morningOrders++;
    let inOrder = 0;
    for (const i of o.items) {
      inOrder += i.qty;
      bases.add(i.config.base);
      if (isCustomDrink(i.config)) s.customDrinks += i.qty;
      if (i.config.matcha > 0) s.matchaDrinks += i.qty;
      s.maxShots = Math.max(s.maxShots, i.config.shots);
      s.bestExtras = Math.max(s.bestExtras, Object.values(i.config.syrups).filter((n) => n > 0).length + i.config.toppings.length);
    }
    s.drinks += inOrder;
    s.biggestOrder = Math.max(s.biggestOrder, inOrder);
  }
  s.bases = bases.size;
  return s;
}

export function expFrom(orders: RewardOrder[], stats: RewardStats): number {
  let exp = stats.quiz ? EXP.quiz : 0;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    exp += EXP.order + (o.status === "completed" ? EXP.completed : 0);
    let drinks = 0;
    for (const i of o.items) {
      drinks += i.qty;
      if (isCustomDrink(i.config)) exp += EXP.customDrink * i.qty;
    }
    exp += EXP.drink * Math.min(drinks, MAX_DRINKS_PER_ORDER);
  }
  return exp + EXP.newBase * stats.bases;
}

// ---------- Badges ----------
export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  /** What it takes. Shown on locked badges as the hint. */
  desc: string;
  /** How far along the person is. `need` of 1 means a simple yes/no badge. */
  progress: (s: RewardStats) => { have: number; need: number };
}

const count = (have: number, need: number) => ({ have: Math.min(have, need), need });

export const BADGES: BadgeDef[] = [
  { id: "first-sip", emoji: "☕", name: "First Sip", desc: "Place your first order", progress: (s) => count(s.orders, 1) },
  { id: "know-thyself", emoji: "🧭", name: "Know Your Taste", desc: "Finish the taste quiz", progress: (s) => count(s.quiz ? 1 : 0, 1) },
  { id: "custom-creator", emoji: "🎨", name: "Custom Creator", desc: "Order a drink you designed yourself", progress: (s) => count(s.customDrinks, 1) },
  { id: "regular", emoji: "🔁", name: "Regular", desc: "Complete 5 orders", progress: (s) => count(s.completed, 5) },
  { id: "loyalist", emoji: "🏅", name: "Loyal Sipper", desc: "Complete 15 orders", progress: (s) => count(s.completed, 15) },
  { id: "explorer", emoji: "🗺️", name: "Menu Explorer", desc: "Try 5 different kinds of drink", progress: (s) => count(s.bases, 5) },
  { id: "all-rounder", emoji: "🌈", name: "All-Rounder", desc: "Try 8 different kinds of drink", progress: (s) => count(s.bases, 8) },
  { id: "matcha-fan", emoji: "🍵", name: "Matcha Fan", desc: "Order 3 matcha drinks", progress: (s) => count(s.matchaDrinks, 3) },
  { id: "mad-scientist", emoji: "🧪", name: "Mad Scientist", desc: "Make one drink with 5 or more syrups and toppings", progress: (s) => count(s.bestExtras, 5) },
  { id: "quad-shot", emoji: "⚡", name: "Quad Shot", desc: "Order a drink with 4 espresso shots", progress: (s) => count(s.maxShots, 4) },
  { id: "sharing", emoji: "🎉", name: "Treat the Crew", desc: "Order 5 or more drinks at once", progress: (s) => count(s.biggestOrder, 5) },
  { id: "doorstep", emoji: "🛵", name: "Doorstep Delivery", desc: "Get an order delivered", progress: (s) => count(s.deliveries, 1) },
  { id: "night-owl", emoji: "🦉", name: "Night Owl", desc: "Order between 8pm and 5am", progress: (s) => count(s.nightOrders, 1) },
  { id: "early-bird", emoji: "🌅", name: "Early Bird", desc: "Order between 5am and 9am", progress: (s) => count(s.morningOrders, 1) },
];

export interface BadgeState { id: string; emoji: string; name: string; desc: string; have: number; need: number; earned: boolean }

export const badgeStates = (s: RewardStats): BadgeState[] =>
  BADGES.map((b) => { const p = b.progress(s); return { id: b.id, emoji: b.emoji, name: b.name, desc: b.desc, ...p, earned: p.have >= p.need }; });

// ---------- Everything the Profile page needs ----------
export interface Rewards {
  level: LevelInfo;
  badges: BadgeState[];
  earned: number;
  orders: number;
  drinks: number;
}

export function computeRewards(orders: RewardOrder[], quizDone: boolean): Rewards {
  const stats = gatherStats(orders, quizDone);
  const badges = badgeStates(stats);
  return { level: levelFor(expFrom(orders, stats)), badges, earned: badges.filter((b) => b.earned).length, orders: stats.orders, drinks: stats.drinks };
}
