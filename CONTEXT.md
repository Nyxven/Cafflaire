# CONTEXT.md — Handoff (paste into a new chat with docs/BUILD_SPEC.md)

## Status: MVP BUILT ✅ (typechecks, lints, unit tests pass, `next build` succeeds, smoke-tested without a DB)
Not yet tested against a real Neon DB / Google OAuth (needs the user's Vercel env). First real-world run is the next step.

## Stack
Next.js 15 (App Router, TS) · Tailwind v3 · Better Auth (email+password, optional Google) · Drizzle + Neon (neon-http) · Zustand (cart in localStorage, builder state) · Framer Motion · Vitest.

## Defaults chosen (discovery was skipped at the user's request)
Brand "Brew Your Own" · currency PHP (centavos) · tap-to-add builder · no sound · top bar + hamburger on mobile · minimal admin page (ADMIN_EMAILS) · no dark mode · cash on pickup/delivery · flat delivery fee `NEXT_PUBLIC_DELIVERY_FEE_CENTS` (5000).

## Implemented
Landing, signup/login (email+password, Google button), truck transition (/welcome, skippable, reduced-motion aware), responsive navbar, Home, Menu (9 presets, filter tabs, Customize/Add), 7-step builder with live SVG cup + stats + price breakdown + naming, basket (qty, edit, duplicate, remove, review checkbox), checkout (pickup slots / delivery address), server-side re-pricing, My Orders + detail (progress, reorder, auto-refresh), Profile, Admin status page.

## Deviations from BUILD_SPEC.md (to keep the MVP lean/reliable)
- Ingredient catalog + presets live in code (`src/lib/catalog.ts`), not DB tables → no seed step.
- Cart is client-side (localStorage), not a DB table; order items are stored as JSONB snapshot on `orders`.
- No profile editing / saved addresses, no password reset email, no Playwright e2e, no CI workflow yet.
- Migrations run automatically on Vercel via `vercel-build` (`scripts/migrate.mjs`).

## Known gaps / next steps
1. Deploy + verify signup, Google login, order flow on Vercel (fix anything env-specific).
2. Add GitHub Actions CI (lint, typecheck, test, build), Playwright smoke test.
3. Online payments (Stripe or PayMongo/GCash), email/SMS notifications, password reset.
4. Saved addresses, profile editing, favorites, ingredient management UI, dark mode.
5. Rate limiting on auth/orders; Sentry/Analytics.

## New-chat prompt
"I'm continuing the Brew Your Own coffee webapp (attached: CONTEXT.md, docs/BUILD_SPEC.md, and the files relevant to the task). Today's task: <task>. Keep the stack, give complete changed files, and update CONTEXT.md at the end."
