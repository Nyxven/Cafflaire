import { describe, expect, it } from "vitest";
import { BASES, MILKS, PRESETS, SYRUPS, TOPPINGS, defaultConfig, unitPrice, validateConfig } from "../src/lib/catalog";
import { flowFor } from "../src/lib/order-flow";

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe("menu variety", () => {
  it("has no duplicate ids or slugs", () => {
    expect(unique(BASES.map((b) => b.id))).toBe(true);
    expect(unique(MILKS.map((m) => m.id))).toBe(true);
    expect(unique(SYRUPS.map((s) => s.id))).toBe(true);
    expect(unique(TOPPINGS.map((t) => t.id))).toBe(true);
    expect(unique(PRESETS.map((p) => p.slug))).toBe(true);
  });
  it("every base can be built with its own defaults", () => {
    for (const b of BASES) expect(validateConfig(defaultConfig(b.id))).toBeNull();
  });
  it("new drinks are priced in whole centavos", () => {
    for (const p of PRESETS) expect(Number.isInteger(unitPrice(p.config))).toBe(true);
  });
  it("keeps the presets the home page picks by position", () => {
    expect(PRESETS[0].slug).toBe("caffe-latte");
    expect(PRESETS[5].slug).toBe("caramel-frappe");
    expect(PRESETS[7].slug).toBe("matcha-latte");
  });
});

describe("order progress", () => {
  it("pickup and delivery have 4 steps ending in completed", () => {
    expect(flowFor("pickup")).toEqual(["pending", "preparing", "ready", "completed"]);
    expect(flowFor("delivery")).toEqual(["pending", "preparing", "out_for_delivery", "completed"]);
  });
});
