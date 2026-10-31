# CONTEXT.md — Handoff (paste into a new chat with docs/BUILD_SPEC.md)

## Status: MVP BUILT ✅ (typechecks, lints, unit tests pass, `next build` succeeds, smoke-tested without a DB)
Not yet tested against a real Neon DB / Google OAuth (needs the user's Vercel env). First real-world run is the next step.

## Stack
Next.js 15 (App Router, TS) · Tailwind v3 · Better Auth (email+password, optional Google) · Drizzle + Neon (neon-http) · Zustand (cart in localStorage, builder state) · Framer Motion · Vitest.

## Locked decisions (from the user)
Brand **Cafflaire** · cozy/warm espresso-cream-caramel look · PHP ₱ (integer centavos) · cash on pickup/delivery · ₱50 flat delivery fee · 15 min minimum prep · tap-to-add + drag-and-drop (handle-based, tap/keyboard fallback) · sound on with mute toggle · seed menu · mobile top bar + hamburger · minimal admin page (ADMIN_EMAILS) · dark mode with switch · Vercel subdomain · private repo `cafflaire`.
**Still open:** delivery area, pickup address, store hours → set `NEXT_PUBLIC_DELIVERY_AREA`, `NEXT_PUBLIC_PICKUP_ADDRESS`, `NEXT_PUBLIC_STORE_HOURS` (display only; store-hours enforcement is NOT implemented until hours are decided).

## Implemented
Landing, signup/login (email+password, Google button), truck transition (/welcome, skippable, reduced-motion aware), responsive navbar with sound + dark-mode toggles, drag-and-drop onto the cup (⠿ handle; items remain tap/keyboard buttons), Home, Menu (9 presets, filter tabs, Customize/Add), 7-step builder with live SVG cup + stats + price breakdown + naming, basket (qty, edit, duplicate, remove, review checkbox), checkout (pickup slots / delivery address), server-side re-pricing, My Orders + detail (progress, reorder, auto-refresh), Profile, Admin status page.

## Deviations from BUILD_SPEC.md (to keep the MVP lean/reliable)
- Ingredient catalog + presets live in code (`src/lib/catalog.ts`), not DB tables → no seed step.
- Cart is client-side (localStorage), not a DB table; order items are stored as JSONB snapshot on `orders`.
- No profile editing / saved addresses, no password reset email, no Playwright e2e, no CI workflow yet.
- Migrations run automatically on Vercel via `vercel-build` (`scripts/migrate.mjs`).

## Known gaps / next steps
0. Decide delivery area / pickup address / store hours, then add store-hours enforcement.
1. Deploy + verify signup, Google login, order flow on Vercel (fix anything env-specific).
2. Add GitHub Actions CI (lint, typecheck, test, build), Playwright smoke test.
3. Online payments (Stripe or PayMongo/GCash), email/SMS notifications, password reset.
4. Saved addresses, profile editing, favorites, ingredient management UI, dark mode.
5. Rate limiting on auth/orders; Sentry/Analytics.

## New-chat prompt
"I'm continuing the Cafflaire coffee webapp (attached: CONTEXT.md, docs/BUILD_SPEC.md, and the files relevant to the task). Today's task: <task>. Keep the stack, give complete changed files, and update CONTEXT.md at the end."
