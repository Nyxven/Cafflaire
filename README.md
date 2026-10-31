# ☕ Cafflaire

Build-your-own-coffee ordering webapp (MVP). Customers build a drink step by step (base → size/temp → shots → milk → sweeteners → toppings → review), see live price / caffeine / sweetness / calories and a rendered cup, add several drinks to a basket, then check out for **pickup or delivery** (cash on pickup/delivery).

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS · Better Auth (email + one-time-code verification) · Drizzle ORM · Neon Postgres · Zustand · Framer Motion · Vitest. Hosted on Vercel.

## Deploy to Vercel (≈10 minutes)

1. **GitHub** – create an empty **private** repo named `cafflaire`, then from this folder:
   ```bash
   git remote add origin https://github.com/<you>/cafflaire.git
   git branch -M main && git push -u origin main
   ```
2. **Vercel** – *Add New → Project* → import the repo.
3. **Neon** – in the Vercel project open **Storage → Create/Connect Database → Neon**. This injects `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`) automatically.
4. **Environment variables** (Project → Settings → Environment Variables):
   | Name | Value |
   |---|---|
   | `BETTER_AUTH_SECRET` | output of `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | your production URL, e.g. `https://cafflaire.vercel.app` |
   | `ADMIN_EMAILS` | your email (unlocks `/admin` to update order status) |
   | `NEXT_PUBLIC_PICKUP_ADDRESS`, `NEXT_PUBLIC_DELIVERY_AREA`, `NEXT_PUBLIC_STORE_HOURS` | optional, shown at checkout once you decide them |
   | `DATA_ENCRYPTION_KEY` | another `openssl rand -base64 32`; encrypts account data (see below) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | your email provider, for sending codes (see below) |
5. **Deploy**, then open `/api/health` - every check should be true. The build runs `scripts/migrate.mjs`, which creates the tables in Neon automatically (it's idempotent). If you ever prefer to do it by hand, paste `drizzle/0000_*.sql` into the Neon SQL editor.

### Email codes (OTP) - required
Sign-up, unverified logins and password resets send a 6-digit code by email, so you need an SMTP provider. Free options:
- **Brevo** (300 emails/day, no domain needed): create an account → *SMTP & API* → generate an SMTP key. Verify your sender address under *Senders*. Use `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` = the login shown on that page, `SMTP_PASS` = the SMTP key, `EMAIL_FROM` = your verified sender, e.g. `Cafflaire <you@gmail.com>`.
- **Gmail** (needs 2-Step Verification on, then create an *App password*): `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=you@gmail.com`, `SMTP_PASS=<app password>`, `EMAIL_FROM=you@gmail.com`.

### Keeping account data safe
- **Passwords** are stored only as salted scrypt hashes (never reversible).
- **One-time codes** are stored only as hashes, expire after 10 minutes, and lock after 5 wrong tries.
- **Emails, names, phone numbers, delivery addresses, notes, IP/user-agent and session tokens** are AES-256-GCM encrypted before they reach the database (`src/lib/crypto.ts`). The key (`DATA_ENCRYPTION_KEY`) lives only in Vercel's environment variables, so a leaked database dump has no readable account data.
- Rate limits on sign-up, login and code requests; users can change their password, sign out everywhere and delete their account (Profile page).
- **Back up `DATA_ENCRYPTION_KEY`.** If you lose or change it, existing encrypted data can't be read.

## Run locally
```bash
npm install
vercel env pull .env.local     # or copy .env.example → .env.local and fill it in
npm run db:migrate
npm run dev
```
Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`.

## How it works
- `src/lib/catalog.ts` – ingredients, prices (integer centavos), caffeine/sugar/calorie math, validation, preset drinks. Shared by the browser preview **and** the server.
- `src/app/api/orders` – re-validates and **re-prices every drink on the server**; client prices are display-only.
- Cart lives in `localStorage`; orders are stored in Neon with a snapshot of each drink and its price.
- `src/middleware.ts` + server-side session checks protect all app pages; `/admin` is limited to `ADMIN_EMAILS`.
- Light/dark theme (toggle in the navbar; remembers your choice), synthesized sound effects with a mute toggle, drag-and-drop onto the cup via each item's ⠿ handle (tapping an item or pressing Enter does the same).
- Prices/stats are approximations; edit them in `catalog.ts`.

See `docs/BUILD_SPEC.md` for the full product spec and `CONTEXT.md` for project status.
