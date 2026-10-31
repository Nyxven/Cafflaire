import { describe, expect, it } from "vitest";
import { MILK_MAP, SYRUP_MAP, TOPPING_MAP, validateConfig } from "../src/lib/catalog";
import { DEFAULT_PREFS, Prefs, normalize, personalise, prefsSchema, rankPicks } from "../src/lib/prefs";
import { PRESETS } from "../src/lib/catalog";

const base: Prefs = { ...DEFAULT_PREFS };

describe("taste preferences", () => {
  it("accepts a valid profile and rejects junk", () => {
    expect(prefsSchema.safeParse(base).success).toBe(true);
    expect(prefsSchema.safeParse({ ...base, categories: [] }).success).toBe(false);
    expect(prefsSchema.safeParse({ ...base, milk: "unicorn" }).success).toBe(false);
  });

  it("resolves conflicts: nut allergy drops almond, vegan drops whole milk", () => {
    expect(normalize({ ...base, milk: "almond", avoidNuts: true }).milk).toBe("oat");
    expect(normalize({ ...base, milk: "whole", vegan: true }).milk).toBe("oat");
  });

  it("every personalised preset stays a valid drink, for every diet", () => {
    for (const vegan of [false, true]) for (const avoidNuts of [false, true]) for (const sweetness of ["none", "light", "sweet", "very"] as const) for (const caffeine of ["light", "balanced", "strong"] as const) {
      const p: Prefs = { ...base, vegan, avoidNuts, sweetness, caffeine, temps: ["hot", "iced", "blended"] };
      for (const preset of PRESETS) expect(validateConfig(personalise(preset.config, p))).toBeNull();
    }
  });

  it("never puts nuts or dairy where the person said no", () => {
    const p: Prefs = { ...base, vegan: true, avoidNuts: true, sweetness: "very", milk: "almond" };
    for (const k of rankPicks(p)) {
      const c = k.config;
      expect(MILK_MAP[c.milk].nuts).toBe(false);
      if (c.milk !== "none") expect(MILK_MAP[c.milk].dairy).toBe(false);
      for (const id of Object.keys(c.syrups)) { expect(SYRUP_MAP[id].nuts).toBe(false); expect(SYRUP_MAP[id].vegan).toBe(true); }
      for (const t of c.toppings) { expect(TOPPING_MAP[t].vegan).toBe(true); expect(TOPPING_MAP[t].dairy).toBe(false); }
    }
  });

  it("ranks the category and temperature someone asked for first", () => {
    const top = rankPicks({ ...base, categories: ["Matcha"], temps: ["iced"] })[0];
    expect(top.preset.category).toBe("Matcha");
    expect(top.config.temp).toBe("iced");
    expect(rankPicks(base)).toHaveLength(PRESETS.length);
  });
});
