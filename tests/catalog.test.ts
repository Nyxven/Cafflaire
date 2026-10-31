import { describe, expect, it } from "vitest";
import { PRESETS, calcStats, defaultConfig, unitPrice, validateConfig } from "../src/lib/catalog";

describe("catalog", () => {
  it("prices a default latte (base 60 + M 20 + 2 shots 70)", () => {
    expect(unitPrice(defaultConfig("latte"))).toBe(6000 + 2000 + 7000);
  });
  it("adds syrup pumps and toppings", () => {
    const c = { ...defaultConfig("latte"), syrups: { vanilla: 2 }, toppings: ["whipped"] };
    expect(unitPrice(c)).toBe(15000 + 4000 + 2500);
  });
  it("calculates caffeine and level", () => {
    const s = calcStats(defaultConfig("latte"));
    expect(s.caffeineMg).toBe(126);
    expect(s.caffeineLevel).toBe("Medium");
  });
  it("rejects invalid drinks", () => {
    expect(validateConfig({ ...defaultConfig("latte"), shots: 0 })).toMatch(/at least 1/);
    expect(validateConfig({ ...defaultConfig("frappe"), temp: "hot" })).toMatch(/can't be made/);
    expect(validateConfig({ ...defaultConfig("latte"), syrups: { vanilla: 9 } })).toMatch(/Pumps/);
  });
  it("all presets are valid", () => {
    for (const p of PRESETS) expect(validateConfig(p.config)).toBeNull();
  });
  it("flags dairy-free / vegan / nuts", () => {
    const s = calcStats({ ...defaultConfig("latte"), milk: "almond" });
    expect(s.tags).toEqual(expect.arrayContaining(["Dairy-free", "Vegan-friendly", "Contains nuts"]));
  });
});
