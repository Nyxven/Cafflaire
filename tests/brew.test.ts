import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_SHOTS, SHOT_BREW_MS, TAP_MS, createBrew, describeIngredients, describeSize, milkPourMs } from "../src/lib/brew";
import { defaultConfig } from "../src/lib/catalog";

function setup(startShots = 0) {
  let shots = startShots;
  const log: string[] = [];
  const brew = createBrew({
    canBrew: () => shots < MAX_SHOTS,
    onStart: () => log.push("start"),
    onShot: () => { shots += 1; log.push("shot"); },
    onStop: (why) => log.push(`stop:${why}`),
    onBlocked: () => log.push("blocked"),
  });
  return { brew, log, shots: () => shots };
}

describe("hold-to-brew", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("adds exactly one shot per full hold", () => {
    const t = setup();
    t.brew.press();
    vi.advanceTimersByTime(SHOT_BREW_MS - 1);
    expect(t.shots()).toBe(0); // not before the shot is full
    vi.advanceTimersByTime(1);
    expect(t.shots()).toBe(1);
    t.brew.release(); // releasing right after the shot completes adds nothing more
    vi.advanceTimersByTime(5000);
    expect(t.shots()).toBe(1);
    expect(t.log.filter((l) => l === "shot")).toHaveLength(1);
  });

  it("keeps adding one shot per second while held, and stops at the limit", () => {
    const t = setup(1);
    t.brew.press();
    vi.advanceTimersByTime(SHOT_BREW_MS * 10);
    expect(t.shots()).toBe(MAX_SHOTS);
    expect(t.brew.active).toBe(false);
    expect(t.log.at(-1)).toBe("stop:done");
  });

  it("cancels (adds nothing) when released early", () => {
    const t = setup();
    t.brew.press();
    vi.advanceTimersByTime(TAP_MS + 200);
    t.brew.release();
    vi.advanceTimersByTime(5000);
    expect(t.shots()).toBe(0);
    expect(t.log.at(-1)).toBe("stop:cancelled");
  });

  it("a quick tap finishes one shot by itself", () => {
    const t = setup();
    t.brew.press();
    vi.advanceTimersByTime(50);
    t.brew.release();
    vi.advanceTimersByTime(SHOT_BREW_MS);
    expect(t.shots()).toBe(1);
    expect(t.log.at(-1)).toBe("stop:done");
  });

  it("a release just after the first shot does not start a free second shot", () => {
    const t = setup();
    t.brew.press();
    vi.advanceTimersByTime(SHOT_BREW_MS + 100); // second shot has barely started
    t.brew.release();
    vi.advanceTimersByTime(5000);
    expect(t.shots()).toBe(1);
  });

  it("ignores extra presses while a shot is filling", () => {
    const t = setup();
    expect(t.brew.press()).toBe(true);
    expect(t.brew.press()).toBe(false);
    expect(t.brew.auto()).toBe(false);
    vi.advanceTimersByTime(50);
    t.brew.release();
    vi.advanceTimersByTime(SHOT_BREW_MS * 3);
    expect(t.shots()).toBe(1);
  });

  it("keyboard: auto() brews exactly one shot", () => {
    const t = setup();
    t.brew.auto();
    vi.advanceTimersByTime(SHOT_BREW_MS * 3);
    expect(t.shots()).toBe(1);
  });

  it("is blocked when the cup already has the maximum shots", () => {
    const t = setup(MAX_SHOTS);
    expect(t.brew.press()).toBe(false);
    expect(t.log).toEqual(["blocked"]);
    expect(t.shots()).toBe(MAX_SHOTS);
  });

  it("dispose() (leaving the step) adds nothing and clears the timer", () => {
    const t = setup();
    t.brew.press();
    vi.advanceTimersByTime(500);
    t.brew.dispose();
    vi.advanceTimersByTime(5000);
    expect(t.shots()).toBe(0);
    expect(t.log.at(-1)).toBe("stop:cancelled");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("helpers", () => {
  it("milk pours longer for bigger, milkier drinks but stays in a sane range", () => {
    const small = milkPourMs({ base: "latte", size: "s" });
    const large = milkPourMs({ base: "latte", size: "l" });
    const americano = milkPourMs({ base: "americano", size: "l" });
    expect(large).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(americano);
    for (const ms of [small, large, americano]) { expect(ms).toBeGreaterThanOrEqual(800); expect(ms).toBeLessThanOrEqual(1900); }
  });

  it("describes the finished drink", () => {
    const c = { ...defaultConfig(), syrups: { vanilla: 2 }, toppings: ["whipped"] };
    expect(describeIngredients(c)).toEqual(["2 espresso shots", "Whole milk", "Vanilla ×2", "Whipped cream"]);
    expect(describeSize(c)).toBe("Medium · 16 oz · Hot");
  });
});
