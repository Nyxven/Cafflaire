// Game rules + timing for the "hands-on" builder. Plain TypeScript (no React) so it can be unit-tested.
// Pricing and limits are NOT decided here: the builder still calls the same catalog/store code.
import { BASE_MAP, Config, MILK_MAP, SIZES, SYRUP_MAP, TOPPING_MAP } from "./catalog";

export const MAX_SHOTS = 4;
export const MAX_MATCHA = 3;
export const MAX_PUMPS = 5;

/** Holding the brew button this long fills exactly ONE shot. */
export const SHOT_BREW_MS = 1100;
/** A press shorter than this is a "tap": the shot finishes by itself. */
export const TAP_MS = 260;
/** Minimum gap between two syrup pumps (stops rapid clicking from adding extra servings). */
export const PUMP_COOLDOWN_MS = 420;
/** Time for a pitcher to swing over the cup and tilt before milk comes out. */
export const PITCHER_LEAD_MS = 380;
/** Time the pitcher needs to swing back after pouring. */
export const PITCHER_BACK_MS = 320;

/** How long the milk pours: bigger drinks and milkier bases pour longer (about 0.9 s - 1.8 s). */
export function milkPourMs(c: Pick<Config, "base" | "size">): number {
  const base = BASE_MAP[c.base];
  if (!base) return 900;
  const portion = base.milkRatio * SIZES[c.size].fill; // 0 .. ~0.75
  return Math.round(800 + 1300 * portion);
}

// ---------------------------------------------------------------------------------------------
// Hold-to-brew controller. One full hold of SHOT_BREW_MS = one shot. Releasing early cancels the
// shot (nothing is added or charged), except a quick tap, which finishes one shot by itself.
// ---------------------------------------------------------------------------------------------
export type BrewStop = "done" | "cancelled";

export interface BrewHooks {
  /** false when the cup already has the maximum number of shots. */
  canBrew: () => boolean;
  /** A shot started filling (also called again if the hold continues into the next shot). */
  onStart: () => void;
  /** A shot is finished: add it to the drink. Called exactly once per shot. */
  onShot: () => void;
  /** Brewing ended. "done" = the last shot completed, "cancelled" = released too early. */
  onStop: (why: BrewStop) => void;
  /** Pressed while the cup is already full of shots. */
  onBlocked?: () => void;
}

export interface BrewClock {
  set: (fn: () => void, ms: number) => unknown;
  clear: (id: unknown) => void;
  now: () => number;
}

const realClock: BrewClock = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function createBrew(h: BrewHooks, clock: BrewClock = realClock) {
  let active = false; // a shot is currently filling
  let held = false; // the pointer is still down
  let pressedAt = 0; // when the pointer went down (for tap detection)
  let timer: unknown = null;

  const begin = () => {
    h.onStart();
    timer = clock.set(commit, SHOT_BREW_MS);
  };

  const stop = (why: BrewStop) => {
    if (timer !== null) clock.clear(timer);
    timer = null;
    active = false;
    held = false;
    h.onStop(why);
  };

  function commit() {
    timer = null;
    h.onShot();
    if (held && h.canBrew()) begin(); // still holding: start the next shot
    else stop("done");
  }

  return {
    get active() { return active; },
    /** Pointer pressed. Returns false when ignored (already brewing, or cup full). */
    press(): boolean {
      if (active) return false;
      if (!h.canBrew()) { h.onBlocked?.(); return false; }
      active = true;
      held = true;
      pressedAt = clock.now();
      begin();
      return true;
    },
    /** Pointer released (or cancelled / lost). Safe to call many times. */
    release() {
      if (!active || !held) return;
      held = false;
      if (clock.now() - pressedAt < TAP_MS) return; // quick tap: let the first shot finish
      stop("cancelled");
    },
    /** Keyboard / assistive tech: brew exactly one shot, no holding needed. */
    auto(): boolean {
      if (active) return false;
      if (!h.canBrew()) { h.onBlocked?.(); return false; }
      active = true;
      held = false;
      begin();
      return true;
    },
    /** Component unmounted: forget everything without adding a shot. */
    dispose() {
      if (!active) return;
      stop("cancelled");
    },
  };
}

// ---------------------------------------------------------------------------------------------
// "Order ticket" text for the finishing screen.
// ---------------------------------------------------------------------------------------------
export function describeIngredients(c: Config): string[] {
  const out: string[] = [];
  if (c.shots) out.push(`${c.shots} espresso shot${c.shots > 1 ? "s" : ""}`);
  if (c.matcha) out.push(`${c.matcha} matcha scoop${c.matcha > 1 ? "s" : ""}`);
  const milk = MILK_MAP[c.milk];
  if (milk && milk.id !== "none") out.push(`${milk.name} milk`);
  for (const [id, n] of Object.entries(c.syrups)) {
    const s = SYRUP_MAP[id];
    if (s && n > 0) out.push(`${s.name} ×${n}`);
  }
  for (const t of c.toppings) if (TOPPING_MAP[t]) out.push(TOPPING_MAP[t].name);
  return out;
}

export function describeSize(c: Config): string {
  const s = SIZES[c.size];
  return `${s.label} · ${s.oz} oz · ${c.temp[0].toUpperCase()}${c.temp.slice(1)}`;
}
