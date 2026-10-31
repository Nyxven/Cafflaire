import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";

process.env.BETTER_AUTH_SECRET = "test-secret-".padEnd(40, "x");
process.env.DATA_ENCRYPTION_KEY = "test-data-key-".padEnd(40, "y");
process.env.BETTER_AUTH_URL = "http://localhost:3000";

const EMAIL = "Maria.Santos@Example.com";
const NAME = "Maria Santos";
const PASS = "correct-horse-battery";
const sent: { email: string; otp: string; type: string }[] = [];
let pg: PGlite;
let auth: ReturnType<typeof import("../src/lib/auth").createAuth>;
const lastOtp = (type: string) => [...sent].reverse().find((m) => m.type === type)!.otp;
const rawDump = async () => JSON.stringify(await Promise.all(["user", "session", "account", "verification"].map((t) => pg.query(`select * from "${t}"`))));

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort())
    for (const stmt of readFileSync(`drizzle/${f}`, "utf8").split("--> statement-breakpoint")) if (stmt.trim()) await pg.exec(stmt);
  const { createAuth } = await import("../src/lib/auth");
  auth = createAuth({ db: drizzle(pg) as never, withNext: false, sendOtp: async (email, otp, type) => { sent.push({ email, otp, type }); } });
});

describe("email + OTP account flow", () => {
  it("signs up and emails a 6-digit code", async () => {
    await auth.api.signUpEmail({ body: { name: NAME, email: EMAIL, password: PASS } });
    expect(sent.at(-1)?.type).toBe("email-verification");
    expect(sent.at(-1)?.otp).toMatch(/^\d{6}$/);
  });

  it("blocks login until the email is verified", async () => {
    const before = sent.length;
    await expect(auth.api.signInEmail({ body: { email: EMAIL, password: PASS } })).rejects.toMatchObject({ status: "FORBIDDEN" });
    expect(sent.length).toBe(before); // the UI requests a fresh code itself
  });

  it("rejects a wrong code, accepts the right one", async () => {
    await expect(auth.api.verifyEmailOTP({ body: { email: EMAIL, otp: "000000" } })).rejects.toBeTruthy();
    const r = await auth.api.verifyEmailOTP({ body: { email: EMAIL, otp: lastOtp("email-verification") } });
    expect(r.user.emailVerified).toBe(true);
  });

  it("logs in and returns decrypted data", async () => {
    const r = await auth.api.signInEmail({ body: { email: EMAIL.toLowerCase(), password: PASS } });
    expect(r.user.email).toBe(EMAIL.toLowerCase());
    expect(r.user.name).toBe(NAME);
    const bad = auth.api.signInEmail({ body: { email: EMAIL, password: "wrong-password-123" } });
    await expect(bad).rejects.toBeTruthy();
  });

  it("stores no readable account data in the database", async () => {
    const dump = await rawDump();
    for (const secret of [EMAIL.toLowerCase(), "maria", "santos", PASS, lastOtp("email-verification")]) expect(dump.toLowerCase()).not.toContain(secret.toLowerCase());
    const acct = (await pg.query(`select password from account`)).rows[0] as { password: string };
    expect(acct.password).toMatch(/^[0-9a-f]+:[0-9a-f]+$/); // salt:scrypt hash
    const user = (await pg.query(`select email, name from "user"`)).rows[0] as { email: string; name: string };
    expect(user.email.startsWith("d1.")).toBe(true);
    expect(user.name.startsWith("e1.")).toBe(true);
  });

  it("resets a forgotten password with an emailed code", async () => {
    await auth.api.requestPasswordResetEmailOTP({ body: { email: EMAIL } });
    await auth.api.resetPasswordEmailOTP({ body: { email: EMAIL, otp: lastOtp("forget-password"), password: "a-brand-new-password" } });
    await expect(auth.api.signInEmail({ body: { email: EMAIL, password: PASS } })).rejects.toBeTruthy();
    const r = await auth.api.signInEmail({ body: { email: EMAIL, password: "a-brand-new-password" } });
    expect(r.user.name).toBe(NAME);
  });
});

describe("order data at rest", () => {
  it("encrypts phone, address and notes but reads them back", async () => {
    const { orders } = await import("../src/lib/db/schema");
    const db = drizzle(pg);
    const [u] = (await pg.query(`select id from "user" limit 1`)).rows as { id: string }[];
    await db.insert(orders).values({
      number: "BYO-TEST01", userId: u.id, fulfilment: "delivery", phone: "+63 917 123 4567",
      address: { line1: "12 Mabini Street", city: "Taguig" }, notes: "Gate code 4821", items: [],
      subtotalCents: 0, deliveryFeeCents: 5000, totalCents: 5000,
    });
    const raw = JSON.stringify((await pg.query(`select * from orders`)).rows);
    for (const secret of ["917", "Mabini", "Taguig", "4821"]) expect(raw).not.toContain(secret);
    const [row] = await db.select().from(orders);
    expect(row.phone).toBe("+63 917 123 4567");
    expect(row.address).toEqual({ line1: "12 Mabini Street", city: "Taguig" });
    expect(row.notes).toBe("Gate code 4821");
  });
});

describe("rate limiting (database storage)", () => {
  it("throttles repeated login attempts and survives the DB-backed limiter", async () => {
    const hit = () => auth.handler(new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9", origin: "http://localhost:3000" },
      body: JSON.stringify({ email: "nobody@example.com", password: "whatever-password" }),
    }));
    const codes: number[] = [];
    for (let i = 0; i < 13; i++) codes.push((await hit()).status);
    expect(codes).toContain(429);
    expect(codes.slice(0, 5).every((c) => c !== 500)).toBe(true);
    const rows = (await pg.query(`select count(*)::int as n from rate_limit`)).rows[0] as { n: number };
    expect(rows.n).toBeGreaterThan(0);
  });
});
