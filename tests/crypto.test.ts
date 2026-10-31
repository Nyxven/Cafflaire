import { describe, expect, it } from "vitest";

process.env.DATA_ENCRYPTION_KEY = "unit-test-key-".padEnd(40, "k");
const load = () => import("../src/lib/crypto");

describe("field encryption", () => {
  it("round-trips and never stores plaintext", async () => {
    const { encryptRandom, decrypt } = await load();
    const c = encryptRandom("+63 912 345 6789");
    expect(c).not.toContain("912");
    expect(decrypt(c)).toBe("+63 912 345 6789");
    expect(encryptRandom("same")).not.toBe(encryptRandom("same"));
  });
  it("deterministic mode is stable for lookups", async () => {
    const { encryptDet, decrypt } = await load();
    expect(encryptDet("a@b.com")).toBe(encryptDet("a@b.com"));
    expect(encryptDet("a@b.com")).not.toBe(encryptDet("c@b.com"));
    expect(decrypt(encryptDet("a@b.com"))).toBe("a@b.com");
  });
  it("detects tampering and passes legacy plaintext through", async () => {
    const { encryptRandom, decrypt } = await load();
    const c = encryptRandom("secret");
    const tampered = c.slice(0, -2) + (c.endsWith("AA") ? "BB" : "AA");
    expect(() => decrypt(tampered)).toThrow();
    expect(decrypt("plain old value")).toBe("plain old value");
  });
});
