// Field-level encryption for personal data stored in Postgres (AES-256-GCM).
// The key lives ONLY in environment variables, never in the database, so a leaked database dump
// contains ciphertext (and password hashes) but no readable emails, names, phones, addresses or session tokens.
//
//  - encryptRandom: fresh random IV each time (names, phone, address, notes, IP, user agent)
//  - encryptDet:    deterministic (IV derived from the value) so equality lookups / UNIQUE still work (email, tokens, OTP identifiers)
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

const RANDOM = "e1.";
const DET = "d1.";
let keys: { enc: Buffer; siv: Buffer } | null = null;

export function keySource(): "dedicated" | "derived" | "missing" {
  return process.env.DATA_ENCRYPTION_KEY ? "dedicated" : process.env.BETTER_AUTH_SECRET ? "derived" : "missing";
}

function getKeys() {
  if (keys) return keys;
  const master = process.env.DATA_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET;
  if (!master) throw new Error("Set DATA_ENCRYPTION_KEY (or at least BETTER_AUTH_SECRET) to encrypt account data.");
  const ikm = Buffer.from(master, "utf8");
  const derive = (info: string) => Buffer.from(hkdfSync("sha256", ikm, "cafflaire", info, 32));
  keys = { enc: derive("enc-v1"), siv: derive("siv-v1") };
  return keys;
}

function seal(plain: string, iv: Buffer) {
  const c = createCipheriv("aes-256-gcm", getKeys().enc, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64url");
}

export const encryptRandom = (plain: string) => RANDOM + seal(plain, randomBytes(12));
export const encryptDet = (plain: string) => DET + seal(plain, createHmac("sha256", getKeys().siv).update(plain).digest().subarray(0, 12));

export function decrypt(value: string): string {
  if (!value.startsWith(RANDOM) && !value.startsWith(DET)) return value; // legacy / unencrypted value
  const buf = Buffer.from(value.slice(3), "base64url");
  const d = createDecipheriv("aes-256-gcm", getKeys().enc, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}
