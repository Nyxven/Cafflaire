import { describe, expect, it } from "vitest";
import { PRESETS, calcStats, defaultConfig, unitPrice, type OrderItem } from "../src/lib/catalog";
import { BADGES, EXP, MAX_LEVEL, RewardOrder, computeRewards, expForLevel, isCustomDrink, levelFor, manilaHour } from "../src/lib/rewards";

const item = (config = PRESETS[0].config, qty = 1): OrderItem => ({ name: "Test", qty, config, unitCents: unitPrice(config), stats: calcStats(config) });
// 2026-11-01 04:00 UTC = 12:00 (noon) in Manila
const NOON = new Date("2026-11-01T04:00:00Z");
const order = (o: Partial<RewardOrder> = {}): RewardOrder => ({ status: "completed", fulfilment: "pickup", createdAt: NOON, items: [item()], ...o });

describe("levels", () => {
  it("starts at level 1 and levels up at the documented thresholds", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(299).level).toBe(2);
    expect(levelFor(300).level).toBe(3);
    expect(expForLevel(5)).toBe(1000);
  });
  it("reports progress inside the level, and never goes past the max", () => {
    const l = levelFor(150);
    expect(l).toMatchObject({ level: 2, into: 50, span: 200, toNext: 150, maxed: false });
    expect(l.pct).toBeCloseTo(0.25);
    const top = levelFor(10_000_000);
    expect(top.level).toBe(MAX_LEVEL);
    expect(top.maxed).toBe(true);
    expect(top.pct).toBe(1);
  });
  it("handles junk input", () => {
    expect(levelFor(-5).level).toBe(1);
    expect(levelFor(12.9).exp).toBe(12);
  });
});

describe("EXP and badges from orders", () => {
  it("a brand new person has nothing", () => {
    const r = computeRewards([], false);
    expect(r.level.exp).toBe(0);
    expect(r.earned).toBe(0);
  });

  it("one completed preset order = order + completed + 1 drink + 1 new base", () => {
    const r = computeRewards([order()], false);
    expect(r.level.exp).toBe(EXP.order + EXP.completed + EXP.drink + EXP.newBase);
    expect(r.badges.find((b) => b.id === "first-sip")?.earned).toBe(true);
    expect(r.badges.find((b) => b.id === "custom-creator")?.earned).toBe(false);
  });

  it("cancelled orders earn nothing", () => {
    expect(computeRewards([order({ status: "cancelled" })], false).level.exp).toBe(0);
  });

  it("an order that is still in progress earns the order EXP but not the completed bonus", () => {
    expect(computeRewards([order({ status: "preparing" })], false).level.exp).toBe(EXP.order + EXP.drink + EXP.newBase);
  });

  it("the taste quiz adds EXP and its badge", () => {
    const r = computeRewards([], true);
    expect(r.level.exp).toBe(EXP.quiz);
    expect(r.badges.find((b) => b.id === "know-thyself")?.earned).toBe(true);
  });

  it("tells a custom drink from a menu preset", () => {
    expect(isCustomDrink(PRESETS[0].config)).toBe(false);
    expect(isCustomDrink({ ...PRESETS[0].config, shots: 3 })).toBe(true);
    // key order must not matter
    const c = PRESETS[3].config;
    expect(isCustomDrink({ ...c, syrups: Object.fromEntries(Object.entries(c.syrups).reverse()) })).toBe(false);
  });

  it("custom drinks earn extra and unlock Custom Creator", () => {
    const custom = { ...defaultConfig("latte"), shots: 3 };
    const r = computeRewards([order({ items: [item(custom, 2)] })], false);
    expect(r.level.exp).toBe(EXP.order + EXP.completed + 2 * EXP.drink + 2 * EXP.customDrink + EXP.newBase);
    expect(r.badges.find((b) => b.id === "custom-creator")?.earned).toBe(true);
  });

  it("drink EXP is capped per order so a huge order can't be farmed", () => {
    const big = computeRewards([order({ items: [item(PRESETS[0].config, 20)] })], false);
    expect(big.level.exp).toBe(EXP.order + EXP.completed + 10 * EXP.drink + EXP.newBase);
  });

  it("Regular needs 5 completed orders, and shows progress before that", () => {
    const four = computeRewards(Array.from({ length: 4 }, () => order()), false).badges.find((b) => b.id === "regular")!;
    expect(four).toMatchObject({ earned: false, have: 4, need: 5 });
    const five = computeRewards(Array.from({ length: 5 }, () => order()), false).badges.find((b) => b.id === "regular")!;
    expect(five.earned).toBe(true);
  });

  it("time-of-day badges use Manila time", () => {
    expect(manilaHour(NOON)).toBe(12);
    expect(manilaHour(new Date("2026-11-01T16:30:00Z"))).toBe(0); // 00:30 Manila
    const night = computeRewards([order({ createdAt: new Date("2026-11-01T16:30:00Z") })], false);
    expect(night.badges.find((b) => b.id === "night-owl")?.earned).toBe(true);
    expect(night.badges.find((b) => b.id === "early-bird")?.earned).toBe(false);
    const morning = computeRewards([order({ createdAt: new Date("2026-11-01T22:00:00Z") })], false); // 06:00 Manila
    expect(morning.badges.find((b) => b.id === "early-bird")?.earned).toBe(true);
  });

  it("delivery, quad shot, matcha and group badges", () => {
    const quad = { ...defaultConfig("latte"), shots: 4 };
    const matcha = PRESETS.find((p) => p.config.matcha > 0)!.config;
    const r = computeRewards([
      order({ fulfilment: "delivery" }),
      order({ items: [item(quad, 1)] }),
      order({ items: [item(matcha, 3)] }),
      order({ items: [item(PRESETS[0].config, 5)] }),
    ], false);
    const got = (id: string) => r.badges.find((b) => b.id === id)!.earned;
    expect(got("doorstep")).toBe(true);
    expect(got("quad-shot")).toBe(true);
    expect(got("matcha-fan")).toBe(true);
    expect(got("sharing")).toBe(true);
  });

  it("badge ids are unique and each has a hint", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) { expect(b.desc.length).toBeGreaterThan(5);  }
  });
});
