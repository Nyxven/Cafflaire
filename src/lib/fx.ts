"use client";
// Tiny event bus for the "game" effects (flying ingredients, pours, drips, +price pops).
// Builder emits events; <FxLayer /> draws them on a fixed, click-through overlay.

export type Pt = { x: number; y: number };
export type Tool = "pitcher" | "nozzle";

export type Fx =
  | { id: number; kind: "fly"; glyph: string; from: Pt; to: Pt }
  | { id: number; kind: "burst"; at: Pt; color: string }
  | { id: number; kind: "drip"; at: Pt; color: string }
  | { id: number; kind: "float"; at: Pt; text: string; bad: boolean };

export type StreamMsg = { key: string; color: string; tool: Tool } | { key: string; off: true };

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
const later = (ms: number, fn: () => void) => { if (ms <= 0) fn(); else setTimeout(fn, ms); };

export function burst(color: string, delay = 0) {
  later(delay, () => { const c = cupSpot(); if (c) emit({ kind: "burst", at: { x: c.x, y: c.y }, color }); });
}

/** An emoji arcs from `from` into the cup, then splashes. */
export function fly(glyph: string, from: Element, color: string) {
  const c = cupSpot();
  if (!c) return;
  emit({ kind: "fly", glyph, from: centerOf(from), to: { x: c.x, y: c.y } });
  burst(color, 600);
}

export function drip(color: string) {
  const c = cupSpot();
  if (!c) return;
  emit({ kind: "drip", at: { x: c.x, y: Math.max(64, c.top - 60) }, color });
  burst(color, 330);
}

export function floatText(text: string, bad = false, delay = 0) {
  later(delay, () => { const c = cupSpot(); if (c) emit({ kind: "float", at: { x: c.x, y: c.top + 24 }, text, bad }); });
}

export function streamOn(key: string, color: string, tool: Tool) {
  const t = offTimers.get(key);
  if (t) { clearTimeout(t); offTimers.delete(key); }
  streamListeners.forEach((l) => l({ key, color, tool }));
}
export function streamOff(key: string) { streamListeners.forEach((l) => l({ key, off: true })); }
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
