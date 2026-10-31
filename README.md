# ☕ Cafflaire

**Build-your-own coffee ordering.** Customers craft a drink step by step like a barista, see the price, caffeine, sweetness and calories update live on a rendered cup, add as many drinks as they like to a basket, then check out for **pickup or delivery** (cash on pickup/delivery).

Live demo: **https://cafflaire.vercel.app** · Built as a hackathon MVP.

---

## Contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How it works](#how-it-works)
4. [Security & privacy](#security--privacy)
5. [Project structure](#project-structure)
6. [Environment variables](#environment-variables)
7. [Run locally](#run-locally)
8. [Deploy to Vercel](#deploy-to-vercel)
9. [Set up email codes (OTP)](#set-up-email-codes-otp)
10. [Admin](#admin)
11. [Testing & quality](#testing--quality)
12. [Troubleshooting](#troubleshooting)
13. [Customizing the menu & prices](#customizing-the-menu--prices)
14. [Roadmap & known limitations](#roadmap--known-limitations)

---

## Features

**Accounts**
- Sign up with email + password; a **6-digit code is emailed** to verify the address (OTP).
- Log in, **forgot password** (reset via emailed code), change password, sign out of all devices, delete account.
- After logging in, a coffee truck drives across the screen on the way to the app (tap to skip; respects reduced-motion settings).

**Barista builder** (`/build`)
- 7 steps: base → size & temperature → espresso/matcha → milk → sweeteners → toppings → review & name your drink.
- A layered SVG cup that changes as you add ingredients (milk, ice, foam, whipped cream, drizzles, toppings, steam).
- Live stats: caffeine (mg + level), sweetness (1–5), calories, sugar, size, and dietary tags (dairy-free, vegan-friendly, contains nuts).
- Live price with a full breakdown.
- **Tap-to-add and drag-and-drop**: drag an item's ⠿ handle onto the cup, or just tap / press Enter. Screen readers get announcements.
- A short taste quiz after first login (onboarding) that personalises the home page, and a Profile / Settings area.
- Light by default, with dark mode (or match-my-device) in Settings. Sound effects can be switched off there too.
- Page transitions, a sliding navbar pill and a cup-fill loading state.

**Ordering**
- Menu of preset drinks (lattes, cappuccino, americano, mocha, frappes, matcha) — order as-is or customize.
- Basket: quantity, edit, duplicate, remove, and a final review of each drink's cup and stats before checkout.
- Checkout: **pickup** (time slots at least 15 minutes out, or ASAP) or **delivery** (address + flat ₱50 fee); cash on pickup/delivery.
- My Orders: history, progress tracker, reorder, auto-refreshing status.

**Responsive**: works on phones and desktops. Mobile has a top bar (logo, cart, hamburger); desktop has the full navbar.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript (strict), Node.js |
| UI | Tailwind CSS (CSS-variable palette, class-based dark mode), Framer Motion |
| Auth | Better Auth: email + password with required email OTP (`emailOTP` plugin) |
| Database | Neon Postgres (via the Vercel Storage integration) with Drizzle ORM |
| Email | nodemailer over SMTP (e.g. Brevo, Gmail) |
| State | Zustand (basket in `localStorage`, builder draft, sound mute) |
| Hosting | Vercel |
| Tests | Vitest, PGlite (in-memory Postgres for auth/DB tests) |

---

## How it works

- **One source of truth for the menu.** `src/lib/catalog.ts` holds ingredients, prices (in integer centavos), caffeine/sugar/calorie math, validation and preset drinks. The browser uses it for the live preview and **the server uses the same code to re-validate and re-price every order**, so a tampered browser can't change what a drink costs.
- **Price** = base + size upcharge + espresso shots + matcha scoops + milk + syrup pumps + toppings.
- **Basket** lives in the browser (`localStorage`). When an order is placed, each drink is saved as a JSON snapshot (config, unit price, stats) on the order, so later menu changes don't alter past orders.
- **Routes are protected** twice: `src/middleware.ts` redirects signed-out visitors, and server components re-check the session.
- **Database setup is automatic.** On Vercel, the `vercel-build` script runs `scripts/migrate.mjs`, which applies the SQL files in `drizzle/` before building. It's idempotent and skips quietly if no database is configured.

### Routes
| Path | What |
|---|---|
| `/` | Landing page |
| `/signup`, `/login`, `/forgot-password` | Account screens (code entry happens inline) |
| `/welcome` | Coffee-truck transition |
| `/home`, `/menu` | Dashboard and preset drinks |
| `/build` | Barista builder (`?preset=<slug>` pre-fills a preset) |
| `/cart`, `/checkout` | Basket and checkout |
| `/orders`, `/orders/[id]` | Order history and detail |
| `/profile` | Account management |
| `/admin` | Order status board (admins only) |
| `/api/health` | Setup diagnostics (no secret values) |

---

## Security & privacy

| Data | Protection |
|---|---|
| Passwords | Salted **scrypt hashes**; never reversible |
| One-time codes | Stored as **hashes**; 10-minute expiry; locked after 5 wrong tries; 30-second resend |
| Emails, names, phone numbers, delivery addresses, notes, IP / user-agent, session tokens | **AES-256-GCM encrypted** before they reach the database (`src/lib/crypto.ts`) |
| Encryption key | `DATA_ENCRYPTION_KEY`, kept only in environment variables, **never** in the database or repo |
| Abuse | Database-backed rate limits on sign-up, login and code requests |
| Orders | Re-priced and validated server-side; users can only read their own orders |

If the database were leaked, an attacker would see only ciphertext and password hashes. Notes:
- Emails and names must be recoverable (to send codes and greet users), so they are **encrypted, not hashed**. Protecting the key matters.
- **Back up `DATA_ENCRYPTION_KEY`.** If it's lost or changed, existing encrypted data can't be read.
- Never commit `.env` files. Only `.env.example` (blank) is tracked.
- Users can delete their account (and orders) from the Profile page.

---

## Project structure

```
src/
  app/
    (auth)/          login, signup, forgot-password
    (app)/           home, menu, build, cart, checkout, orders, profile, admin  (signed-in shell + navbar)
    welcome/         coffee-truck transition
    api/             auth/[...all], orders, admin/orders/[id], health
  components/        Builder, Cup (SVG), Navbar, AuthForm, AccountPanel, CartView,
                     CheckoutForm, Truck, Onboarding, SettingsPanel, SoundToggle, ...
  lib/
    catalog.ts       menu, prices, stats, validation, presets  (shared client + server)
    auth.ts          Better Auth setup (OTP, rate limits)      auth-client.ts  browser client
    crypto.ts        AES-256-GCM field encryption              mail.ts         SMTP + OTP email
    db/              Drizzle schema (encrypted column types)   store.ts / sound.ts / hydrated.ts
  middleware.ts      route protection
drizzle/             SQL migrations (applied automatically on deploy)
scripts/migrate.mjs  migration runner
tests/               catalog, crypto, full auth + DB flow
docs/                BUILD_SPEC.md, ENV_REFERENCE.md
CONTEXT.md           project status / handoff notes
```

---

## Environment variables

Full table with purposes: [`docs/ENV_REFERENCE.md`](docs/ENV_REFERENCE.md). In short:

| Secrets (mark *Sensitive* in Vercel) | Config |
|---|---|
| `BETTER_AUTH_SECRET`, `DATA_ENCRYPTION_KEY`, `SMTP_USER`, `SMTP_PASS`, and Neon's `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`) | `BETTER_AUTH_URL`, `ADMIN_EMAILS`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_CURRENCY`, `NEXT_PUBLIC_DELIVERY_FEE_CENTS`, `NEXT_PUBLIC_MIN_PREP_MINUTES`, optional `NEXT_PUBLIC_PICKUP_ADDRESS` / `NEXT_PUBLIC_DELIVERY_AREA` / `NEXT_PUBLIC_STORE_HOURS` |

Generate the two keys with `openssl rand -base64 32`. Anything prefixed `NEXT_PUBLIC_` is sent to browsers — never put a secret in one.

---

## Run locally

Requirements: Node.js 20+ and a Postgres database (a free Neon database works).

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, BETTER_AUTH_SECRET, DATA_ENCRYPTION_KEY
npm run db:migrate                # creates the tables
npm run dev                       # http://localhost:3000
```

If SMTP isn't configured, the app **prints each verification code in the terminal** during local development (never in production), so you can sign up without an email provider.

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Vitest (catalog, crypto, full auth + DB flow) |
| `npm run db:generate` | Create a new SQL migration after changing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database in `.env.local` |

---

## Deploy to Vercel

1. **Push to GitHub** (the project files must be at the repo root, next to `package.json`).
2. **Vercel** → *Add New → Project* → import the repo. Leave the framework as Next.js and **don't override the build command** (the `vercel-build` script creates the database tables).
3. **Database:** project → **Storage** → create/connect **Neon**, enabled for Production and Preview. This adds `DATABASE_URL` and friends automatically.
4. **Environment variables:** add the secrets and config listed above (Settings → Environment Variables, Production + Preview).
5. **Deploy / Redeploy.** New variables only apply to new deployments. In the build log, look for `[migrate] Database is up to date.`
6. Open **`/api/health`** — everything should be green (see [Troubleshooting](#troubleshooting)).
7. Sign up, verify with the emailed code, and place a test order.

Tip: pick the Vercel function region closest to your Neon region (e.g. Singapore for the Philippines).

---

## Set up email codes (OTP)

Verification and password-reset codes are sent by email, so production needs an SMTP provider. Free options:

**Brevo** (300 emails/day, no domain needed)
1. Create an account at brevo.com.
2. *Senders, Domains & Dedicated IPs → Senders*: add a sender email you can open and verify it.
3. *SMTP & API → SMTP*: note the **Login** and generate an **SMTP key** (shown once).
4. In Vercel set `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER=<Login>`, `SMTP_PASS=<key>`, `EMAIL_FROM="Cafflaire <your verified sender>"`.

**Gmail** (needs 2-Step Verification + an App password): `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=<gmail>`, `SMTP_PASS=<app password>`, `EMAIL_FROM=<gmail>`.

Check *Spam/Promotions* if a code doesn't arrive; Brevo's *Transactional → Logs* shows what was sent.

---

## Admin

Set `ADMIN_EMAILS` (comma-separated) to the email(s) that should manage orders. Those accounts get an **Admin** link that opens `/admin`, a table of the latest orders with a status dropdown (`pending → preparing → ready / out for delivery → completed`, or `cancelled`). Customers' order pages update automatically.

---

## Testing & quality

`npm test` runs 22 tests (taste-preference logic included), including the whole account flow against an in-memory Postgres:
- sign up → emailed code → wrong code rejected → verify → login → password reset;
- a dump of the raw tables contains **no** readable email, name, password or code;
- order phone/address/notes are encrypted at rest and decrypt correctly;
- repeated login attempts are rate-limited through the database;
- pricing, caffeine and validation rules for every preset.

CI-style checks: `npm run typecheck`, `npm run lint`, `npm run build`.

---

## Troubleshooting

Open **`/api/health`** first. It reports (without revealing secrets):

| Flag | If false / wrong |
|---|---|
| `secretSet` | Add `BETTER_AUTH_SECRET`, redeploy |
| `databaseUrlSet` / `databaseReachable` | Connect Neon under Storage for Production + Preview, redeploy (or restore `DATABASE_URL`) |
| `tablesExist` | Redeploy and check the build log for `[migrate] Database is up to date.`; or run the SQL in `drizzle/` in Neon's SQL editor (in order) |
| `emailConfigured` | Add the `SMTP_*` and `EMAIL_FROM` variables, redeploy |
| `encryptionKey` | `"dedicated"` is correct; `"derived"` means `DATA_ENCRYPTION_KEY` is missing; `"missing"` means no keys are set |

Common problems:
- **"Server setup problem" on signup** → something above is false; check `/api/health`.
- **No code email** → sender not verified, `SMTP_USER` isn't the provider's login, wrong key, or it's in spam.
- **Old test accounts stopped working** → the encryption key changed; clear them with `delete from "user";` in the Neon SQL editor.
- **Env var changes don't show** → redeploy; `NEXT_PUBLIC_*` values are baked in at build time.

---

## Customizing the menu & prices

Everything lives in `src/lib/catalog.ts`: `BASES`, `MILKS`, `SYRUPS`, `TOPPINGS`, `SIZES`, shot/matcha prices, and `PRESETS`. Prices are **integer centavos** (₱35 = `3500`). Caffeine, sugar and calorie values are approximations for display. Add a new ingredient there and it appears in the builder, stats and server validation automatically (new bases also need a milk ratio and allowed temperatures).

---

## Roadmap & known limitations

- Delivery area, pickup address and store hours are still undecided; the optional `NEXT_PUBLIC_*` variables display them, but **store hours aren't enforced yet**.
- Payments are cash only. Next: online payment (e.g. PayMongo / GCash).
- Not yet built: saved addresses, profile name editing, favorites, push/SMS notifications, an admin ingredient editor, CI workflow and browser (Playwright) tests.
- The basket is stored per browser, not per account.

---

*Docs:* [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) (product spec) · [`docs/ENV_REFERENCE.md`](docs/ENV_REFERENCE.md) · [`CONTEXT.md`](CONTEXT.md) (status & handoff notes)
