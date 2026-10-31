# CONTEXT.md — Cafflaire handoff (paste this + docs/BUILD_SPEC.md into a new chat)

## What this is
**Cafflaire**: a mobile + desktop coffee-ordering webapp (hackathon MVP). Customers build their own coffee in a barista-style builder (live SVG cup, caffeine/sweetness/calorie stats, running price), add several drinks to a basket, then check out for pickup or delivery (cash). PHP ₱, integer centavos.

## Update (2026-10-31, signup-email fix chat)
- **Problem:** signup showed the "enter code" screen but no email arrived. Likely causes fixed in code: (1) Better Auth sends the sign-up OTP in the background and Vercel can freeze the function before SMTP finishes → `auth.ts` now uses `advanced.backgroundTasks.handler` with Next's `after()` (falls back to plain run outside a request, e.g. tests); (2) `EMAIL_FROM` was optional and fell back to `SMTP_USER` (Brevo login `…@smtp-brevo.com` is NOT a valid sender) → `mailConfigured()` now REQUIRES `EMAIL_FROM`; (3) SMTP errors were invisible → `mail.ts` has 10–15s timeouts, logs `[mail] send failed {code,responseCode,response}` (no secrets/codes) to Vercel Logs, and exports `verifyMail()`.
- **New diagnostics:** `/api/health` now also shows `emailFromSet`; `/api/health?mail=1` tests the SMTP login without sending (`smtp: {ok:true}` or `{ok:false, code:"EAUTH"|"ECONNECTION"|"ETIMEDOUT"|…}`).
- **Not verified:** these 3 edits were made without running typecheck/tests (no node_modules/network in that sandbox). If `npm run build` fails on `advanced.backgroundTasks`, remove that block from `auth.ts` and tell the next chat. Real-stack result still unknown → ask for `/api/health?mail=1` output and the Vercel log line.
- Brevo reminder: `EMAIL_FROM` must be a sender verified in Brevo (Senders & IP); `SMTP_USER` is the Brevo SMTP login, `SMTP_PASS` the SMTP key (not the account password/API key).

## State as of 2026-10-31 (end of previous chat)
- **Code: feature-complete.** Verified in-sandbox: typecheck, lint, production build, 17 tests (catalog, crypto, full signup → emailed OTP → verify → login → password reset, DB-leak check, DB-backed rate limiting, encrypted order data) on an in-memory Postgres (PGlite).
- **NOT yet verified on the real stack** (Vercel + Neon + SMTP). Earlier real-world errors: "Provider not found" (Google; now removed) and "Sorry, something went wrong" on signup (server setup: tables/env). Current status unknown → first thing to ask: what does `https://cafflaire.vercel.app/api/health` return?
- **Repo:** `https://github.com/Nyxven/Cafflaire` (PUBLIC, hackathon, branch main). Live site: `https://cafflaire.vercel.app`. When last checked, GitHub still had the OLD project at its root plus a stray nested `cafflaire` entry (the new zip had been unzipped inside the old folder, so it was committed as an embedded repo). The user was told to run, from INSIDE the nested folder: `git remote add origin https://github.com/Nyxven/Cafflaire.git` then `git push --force origin main`. Unconfirmed whether that was done — verify the repo root shows `src/`, README mentioning email codes, no stray `cafflaire` entry.
- **Env vars:** user deleted all Vercel variables except the Neon ones (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_*`) and was pasting two files: `VERCEL_SECRETS.txt` (BETTER_AUTH_SECRET, DATA_ENCRYPTION_KEY, SMTP_USER, SMTP_PASS) and `VERCEL_CONFIG.txt` (BETTER_AUTH_URL, ADMIN_EMAILS, EMAIL_FROM, SMTP_HOST, SMTP_PORT, NEXT_PUBLIC_*). Secrets are NOT in this repo or these docs. See `docs/ENV_REFERENCE.md`. The encryption key changed, so any pre-existing test users are unreadable → `delete from "user";` in Neon.
- **Email (OTP):** user has no Google Cloud. Recommended Brevo SMTP (free, 300/day; verify a sender; SMTP login + key). Gmail app password is the alternative. Not confirmed configured.
- **Unresolved:** the user asked who "fancehe1" is (seen as the person pushing prod). Unknown; nothing in this project uses that name (commits are by "Cafflaire" / dev@example.com). They were given an audit checklist (GitHub commits/collaborators, Vercel deployments/members, `git config user.name`, rotate secrets, 2FA). Follow up if they report an unknown account.
- **User style:** non-expert, wants plain-language step-by-step guidance (stepper cards work well), is on a hackathon deadline and low on credits — keep answers short and actionable, give files not lectures.

## Stack
Next.js 15 (App Router, TS strict) · Tailwind v3 (CSS-variable palette, class dark mode) · Better Auth (email+password, REQUIRED email-OTP verification via `emailOTP` plugin) · Drizzle ORM + Neon (`neon-http`, no transactions) · nodemailer (SMTP) · Zustand (cart in localStorage, builder state, sound mute) · Framer Motion · Vitest + PGlite.

## Locked decisions
Brand Cafflaire · cozy espresso/cream/caramel look · cash on pickup/delivery · ₱50 flat delivery fee · 15 min minimum prep · tap-to-add + drag-and-drop (⠿ handle onto cup; tap/Enter fallback) · sound on with mute toggle (Web Audio, no files) · seed menu in code · mobile top bar (logo, cart, hamburger) · minimal `/admin` (ADMIN_EMAILS) · dark mode switch · Vercel subdomain.
**Still open:** delivery area, pickup address, store hours → optional env `NEXT_PUBLIC_DELIVERY_AREA`, `NEXT_PUBLIC_PICKUP_ADDRESS`, `NEXT_PUBLIC_STORE_HOURS` (display only; store-hours enforcement NOT implemented).

## Key files
- `src/lib/catalog.ts` ingredients, prices, stats, validation, presets (shared client+server; server re-prices every order)
- `src/lib/auth.ts` `createAuth({db, sendOtp, withNext})`; `auth-client.ts`; `mail.ts` (SMTP OTP emails); `crypto.ts` (AES-256-GCM field encryption); `db/schema.ts` (encrypted column types `encText`/`detText`/`encJson`); `store.ts`; `sound.ts`
- `src/components/` Builder, Cup (SVG), Navbar, AuthForm (login/signup/verify/forgot/reset), AccountPanel, CartView, CheckoutForm, Truck, ThemeToggle, SoundToggle
- `src/app/(auth)` login, signup, forgot-password · `src/app/welcome` truck · `src/app/(app)` home, menu, build, cart, checkout, orders, profile, admin · `src/app/api/{auth,orders,admin/orders/[id],health}`
- `drizzle/0000*.sql, 0001*.sql` migrations; `scripts/migrate.mjs` runs on Vercel via `vercel-build` (skips if no DB URL)
- `tests/` catalog, crypto, auth.flow (PGlite)

## Security model
Passwords: scrypt hashes. OTP: hashed, 6 digits, 10-min expiry, 5 attempts, 30s resend. Emails/session tokens/OTP identifiers: deterministic AES-GCM (lookups work). Names/phones/addresses/notes/IP/user-agent: randomized AES-GCM. Key = `DATA_ENCRYPTION_KEY` (env only; falls back to derivation from `BETTER_AUTH_SECRET`). Losing the key makes data unreadable. Rate limits on sign-up/sign-in/OTP routes (DB storage). Profile: change password, sign out all devices, delete account. Pre-OTP test users should be deleted (`delete from "user";`).

## Env vars
`DATABASE_URL`(+`_UNPOOLED`, from Neon) · `BETTER_AUTH_SECRET` · `DATA_ENCRYPTION_KEY` · `BETTER_AUTH_URL` (optional on Vercel) · `SMTP_HOST/PORT/USER/PASS` · `EMAIL_FROM` · `ADMIN_EMAILS` · `NEXT_PUBLIC_APP_NAME/CURRENCY/DELIVERY_FEE_CENTS/MIN_PREP_MINUTES` · optional store-detail vars above. Full list with secret-vs-config split: `docs/ENV_REFERENCE.md`.

## Debugging
Open `/api/health`: `secretSet`, `databaseUrlSet`, `databaseReachable`, `tablesExist`, `encryptionKey` (want "dedicated"), `emailConfigured` — all must be true/ok. Tables missing → Neon connected after first deploy: connect for Production + redeploy and look for `[migrate] Database is up to date.` in the build log. Signup 500 → check health first.

## Next steps (in order)
1. Get the user to deploy and report `/api/health?mail=1`; fix any false flag / smtp error code.
2. Configure SMTP (Brevo) and test signup → email code → welcome truck → build → checkout → order → `/admin`.
3. Decide delivery area / pickup address / store hours; add hours enforcement.
4. Optional: GitHub Actions CI, Playwright smoke test, online payments (PayMongo/GCash), saved addresses, profile name editing.

## Gotchas learned
`sh` has no brace expansion (use bash for mkdir -p {a,b}) · never pipe `next build` into `head` (corrupts .next) · Next 15 `params`/`searchParams` are Promises · page files may only export Next's allowed names · sticky inside CSS grid on mobile needs flex-col · Better Auth does NOT auto-send an OTP on a blocked unverified login (UI requests one) · rate limiting only applies via `auth.handler`, not `auth.api.*`.

## New-chat prompt
"I'm continuing the Cafflaire coffee webapp (attached: CONTEXT.md, docs/BUILD_SPEC.md, and any files/errors relevant to today's task). Today's task: <task>. Keep the stack and decisions above, give complete changed files, keep secrets out of the repo (the repo is public), and update CONTEXT.md at the end."
