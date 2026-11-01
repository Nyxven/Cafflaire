"use client";
// Tiny event bus for the "game" effects (flying ingredients, pours, drops, powder, drizzle, sparkles, +price pops).
// Builder emits events; <FxLayer /> draws them on a fixed, click-through overlay.
// Nothing here changes the drink: the builder updates its own state, these are only visuals.

export type Pt = { x: number; y: number };
export type Tool = "pitcher" | "nozzle";

export type Fx =
  | { id: number; kind: "fly"; glyph: string; from: Pt; to: Pt; ms: number; tilt: boolean }
  | { id: number; kind: "burst"; at: Pt; color: string }
  | { id: number; kind: "sparkle"; at: Pt; big: boolean }
  | { id: number; kind: "powder"; at: Pt; color: string }
  | { id: number; kind: "drizzle"; at: Pt; color: string }
  | { id: number; kind: "float"; at: Pt; text: string; bad: boolean };

export type StreamMsg = { key: string; color: string; tool: Tool } | { key: string; off: true };

/** How long each flight takes to reach the cup (ms). The builder adds the ingredient when it lands. */
export const LAND = { fly: 620, drop: 520, scoop: 780, drizzle: 640 } as const;

const fxListeners = new Set<(e: Fx) => void>();
const streamListeners = new Set<(m: StreamMsg) => void>();
const offTimers = new Map<string, ReturnType<typeof setTimeout>>();
let n = 0;

export const onFx = (l: (e: Fx) => void) => { fxListeners.add(l); return () => { fxListeners.delete(l); }; };
export const onStream = (l: (m: StreamMsg) => void) => { streamListeners.add(l); return () => { streamListeners.delete(l); }; };

type Distributive<T> = T extends unknown ? Omit<T, "id"> : never;
const emit = (e: Distributive<Fx>) => { const full = { ...e, id: ++n } as Fx; fxListeners.forEach((l) => l(full)); };

/** Where the cup is on screen (the element marked data-cup). */
export function cupSpot() {
  if (typeof document === "undefined") return null;
  const el = document.querySelector("[data-cup]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, top: r.top, y: r.top + r.height * 0.42, h: r.height };
}

const centerOf = (el: Element): Pt => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
/** Where something starts from: an element on the page, an exact point, or nowhere in particular. */
export type Src = Element | Pt | null;
const spot = (s: Src): Pt | null => (!s ? null : "getBoundingClientRect" in s ? centerOf(s) : s);
const later = (ms: number, fn: () => void) => { if (ms <= 0) fn(); else setTimeout(fn, ms); };

export function burst(color: string, delay = 0) {
  later(delay, () => { const c = cupSpot(); if (c) emit({ kind: "burst", at: { x: c.x, y: c.y }, color }); });
}

/** A little star-burst over the cup: "that step worked". `big` is used for the finished drink. */
export function sparkle(big = false, delay = 0) {
  later(delay, () => { const c = cupSpot(); if (c) emit({ kind: "sparkle", at: { x: c.x, y: c.top + c.h * 0.3 }, big }); });
}

/** An item arcs from `from` into the cup, then splashes. Returns when it lands (ms). */
export function fly(glyph: string, from: Src, color: string): number {
  const c = cupSpot();
  if (!c) return 0;
  const start = spot(from) ?? { x: c.x + 90, y: c.top + 10 };
  emit({ kind: "fly", glyph, from: start, to: { x: c.x, y: c.y }, ms: LAND.fly, tilt: false });
  burst(color, LAND.fly);
  return LAND.fly;
}

/** A syrup droplet travels from the pump nozzle into the cup. */
export function drop(from: Src, color: string): number {
  const c = cupSpot();
  if (!c) return 0;
  const start = spot(from) ?? { x: c.x, y: c.top + 12 };
  emit({ kind: "fly", glyph: `drop:${color}`, from: start, to: { x: c.x, y: c.y }, ms: LAND.drop, tilt: false });
  burst(color, LAND.drop);
  return LAND.drop;
}

/** A scoop swings over the cup, tips, and powder falls in. */
export function scoop(from: Src, color: string): number {
  const c = cupSpot();
  if (!c) return 0;
  const start = spot(from) ?? { x: c.x + 90, y: c.top + 10 };
  const above = { x: c.x, y: c.top + 28 };
  emit({ kind: "fly", glyph: "🥄", from: start, to: above, ms: 480, tilt: true });
  later(430, () => emit({ kind: "powder", at: above, color }));
  burst(color, LAND.scoop);
  return LAND.scoop;
}

/** A ribbon of sauce flows down from above the cup. */
export function drizzle(color: string): number {
  const c = cupSpot();
  if (!c) return 0;
  emit({ kind: "drizzle", at: { x: c.x, y: c.top + 8 }, color });
  burst(color, LAND.drizzle);
  return LAND.drizzle;
}

export function floatText(text: string, bad = false, delay = 0) {
  later(delay, () => { const c = cupSpot(); if (c) emit({ kind: "float", at: { x: c.x, y: c.top + 24 }, text, bad }); });
}

export function streamOn(key: string, color: string, tool: Tool) {
  const t = offTimers.get(key);
  if (t) { clearTimeout(t); offTimers.delete(key); }
  streamListeners.forEach((l) => l({ key, color, tool }));
}
export function streamOff(key: string) {
  const t = offTimers.get(key);
  if (t) { clearTimeout(t); offTimers.delete(key); }
  streamListeners.forEach((l) => l({ key, off: true }));
}
/** Stop a stream after a short delay so quick taps still show a visible pour. */
export function release(key: string, ms = 450) {
  const t = offTimers.get(key);
  if (t) clearTimeout(t);
  offTimers.set(key, setTimeout(() => { offTimers.delete(key); streamOff(key); }, ms));
}
export function pourFor(key: string, color: string, tool: Tool, ms: number) { streamOn(key, color, tool); release(key, ms); }

export function haptic(ms = 12) {
  try { navigator.vibrate?.(ms); } catch { /* not supported */ }
}
