# ☕ Brew Your Own — Coffee Ordering Webapp (MVP Build Spec)

> Working name: **Brew Your Own** (placeholder, change anytime via `NEXT_PUBLIC_APP_NAME`).
> Goal: customers **build their own coffee** step by step (barista-game style), add it to a basket, repeat, then check out for **pickup or delivery**.

---

## 0. ASK FIRST — Discovery Protocol (mandatory before any building)

**Instruction to the AI building this project:** Do **not** start coding, scaffolding, or generating files until the person has answered the discovery questions below. This applies to the very first chat **and** to the start of every phase.

**How to ask**
1. Ask in small batches (max 3 questions at a time), one batch per message, using tappable multiple-choice options where possible (plus an "Other / you decide" option).
2. Always offer a **recommended default** so the person can answer "defaults" and move on.
3. If the answer is already in `CONTEXT.md` (Key Decisions), don't ask again.
4. After the last batch, send a **short summary of the decisions** and wait for "go" / corrections. Only then build.
5. Record every answer in `CONTEXT.md` → *Key Decisions*.

### Batch A — Brand & Look
- Brand name? (default: "Brew Your Own")
- Overall vibe? (Cozy & warm · Modern & minimal · Playful & colorful · You decide)
- Color direction? (Espresso/cream/caramel [default] · Matcha green · Pastel · Custom hex colors)

### Batch B — Business Rules
- Currency & price style? (PHP ₱ [default] · USD $ · Other)
- Fulfilment details: delivery fee (flat amount? by distance?), delivery area, pickup location/address, store hours?
- Payment for MVP? (Cash on pickup/delivery [default] · Add GCash/online payment now · Add later)

### Batch C — The Barista Experience
- Interaction style? (Tap to add [default] · Drag-and-drop with tap fallback · Both)
- Sound effects? (Off [default] · On with mute toggle)
- Starter drinks & ingredients? (Use the seed menu in §7 [default] · I'll give my own list/prices)
- Show nutrition/caffeine stats how? (Live panel [default] · Only on review screen)

### Batch D — App Decisions
- Mobile navigation? (Top bar + hamburger [as requested] · Bottom tab bar · Both)
- Include a minimal admin page to update order status in the MVP? (Yes [default] · No)
- Dark mode in MVP? (No [default] · Yes)
- GitHub repo name & visibility? (`brew-your-own`, private [default] · Other)
- Custom domain or Vercel subdomain? (Vercel subdomain [default] · Custom)

### Per-Phase Check (start of each phase)
Before building Phase N, ask only the **phase-specific** open questions (e.g., Phase 4: truck style & duration; Phase 6: which builder steps to include/skip; Phase 9: time-slot length, minimum order). Confirm the plan in 3–5 bullets, wait for approval, then build.

> If the person says **"defaults"**, use the recommended defaults, log them in `CONTEXT.md`, and proceed.

---

## 1. Product Summary

| Item | Decision |
|---|---|
| Core loop | Build drink → see live preview + stats → Add to basket → (repeat) → Checkout |
| Fulfilment | Pickup (time slot) or Delivery (address + fee) |
| Auth | Email + password and Google (Better Auth) |
| Currency | Configurable, default `PHP` (₱) via `NEXT_PUBLIC_CURRENCY` |
| Devices | Mobile-first responsive, fully usable on desktop |
| Payments (MVP) | Cash on pickup / cash on delivery. Online payment is Phase 2 (see §13) |

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | **Node.js 20+ / 22 LTS** | |
| Framework | **Next.js (App Router) + TypeScript (strict)** | Node-based, first-class Vercel support, server actions + route handlers |
| UI | **Tailwind CSS** + `clsx`/`tailwind-merge` | Optional: shadcn/ui primitives for accessible components |
| Animation | **Framer Motion** | Truck transition, cup fill, ingredient drops |
| State (builder) | **Zustand** | Builder draft + cart (cart persisted to DB when logged in) |
| Auth | **Better Auth** | `emailAndPassword` + `socialProviders.google` |
| Database | **Neon Postgres** via **Vercel Storage / Marketplace** | Serverless driver |
| ORM | **Drizzle ORM** + `drizzle-kit` migrations | Better Auth has a Drizzle adapter |
| Validation | **Zod** | Shared schemas client/server |
| Hosting | **Vercel** | Preview deploys per PR |
| Testing | Vitest (unit), Playwright (e2e smoke) | |
| Quality | ESLint, Prettier, Husky + lint-staged, GitHub Actions CI | |

> Verify current Better Auth / Drizzle / Neon setup against their docs when implementing; APIs change.

---

## 3. Information Architecture

```
/                    Landing (public) – hero, how it works, sign up / log in
/login, /signup      Auth forms (email+password, Google button)
/welcome             Post-login truck transition → redirects to /home
/home                Dashboard – featured drinks, "Build my coffee" CTA, recent orders
/menu                Preset drinks (Frappes, Lattes, Matcha, …) → "Customize" opens builder pre-filled
/build               Barista builder (the core experience)
/cart                Basket review
/checkout            Pickup/Delivery, contact, summary, place order
/orders              My Orders list
/orders/[id]         Order detail + status
/profile             Name, email, saved addresses, sign out
```

All routes except `/`, `/login`, `/signup` require a session (middleware + server-side check).

---

## 4. Navigation Bar

**Desktop (≥ 1024px)**
- **Left:** Logo + brand name (links to `/home`)
- **Center:** Home · Menu · Build My Coffee · My Orders (active link underline/pill)
- **Right:** Cart icon with item-count badge · Profile avatar dropdown (Profile, Sign out)

**Mobile (< 1024px)**
- **Top bar:** Logo · Cart icon (with badge) · Hamburger
- **Hamburger drawer:** Home, Menu, Build My Coffee, My Orders, Profile, Sign out
- **Personalization upgrade (recommended):** a fixed **bottom tab bar** on mobile with Home · Menu · **Build (center, elevated button)** · Orders · Profile, since thumb reach is better. Keep the hamburger for secondary links if you prefer the original request. Pick one in Phase 1 and document it in `CONTEXT.md`.

Accessibility: `<nav aria-label="Primary">`, focus trapping in the drawer, `aria-current="page"`, ≥ 44×44px touch targets, Esc closes the drawer.

---

## 5. Visual Design ("prettier UI")

- **Palette (tokens in `tailwind.config`):**
  - `cream` `#FFF8F0` (background) · `espresso` `#3B2417` (text/primary) · `caramel` `#C68642` (accent) · `matcha` `#7A9E5A` (secondary) · `milk` `#F3E5D0` (cards) · `berry` `#B5446E` (highlights/alerts)
- **Type:** a friendly display font for headings (e.g. Fraunces or Poppins) + Inter for body, via `next/font`.
- **Shape:** rounded-2xl cards, soft shadows, generous spacing, subtle grain/steam illustrations.
- **Dark mode:** optional Phase 2 (use CSS variables so it is easy).
- **Empty/loading/error states** designed for every page (skeletons, friendly copy).
- Respect `prefers-reduced-motion` everywhere (disable truck/pour animations → simple fade).

---

## 6. Feature Specs

### 6.1 Landing page + Accounts
- Hero with CTA buttons **Sign up** and **Log in**, short "How it works" (Build → Basket → Pickup/Delivery), featured drink visuals.
- **Sign up:** name, email, password (min 8, strength hint), confirm. **Continue with Google** button.
- **Log in:** email + password, Google, "Forgot password" (email flow is Phase 2; stub link in MVP).
- Better Auth config: `emailAndPassword.enabled`, `socialProviders.google` (client ID/secret in env), Drizzle adapter, secure cookies, rate limiting on auth routes.
- Errors are inline and accessible (`aria-live`).

### 6.2 Truck Transition (`/welcome`)
- After successful login/signup, redirect to `/welcome`.
- A coffee truck (SVG) drives left → right across the screen (~2.2s) with bobbing wheels, steam puffs, and a road line; text "Brewing your experience…"; then auto-navigate to `/home`.
- **Skip** button and click-to-skip; shown **once per login** (sessionStorage flag); reduced-motion users get a 600ms fade instead.
- Preload `/home` data during the animation so there is no flash after.

### 6.3 Barista Builder (`/build`) — the core
Step-by-step like a coffee-shop sim. Each step is a full-screen panel on mobile and a two-pane layout on desktop (left: live cup preview + stats, right: step controls). Tap or drag-and-drop ingredients onto the cup.

| Step | What the customer does |
|---|---|
| 1. Pick a base | Latte, Cappuccino, Americano, Mocha, Iced Coffee, Frappe, Matcha Latte (extensible) |
| 2. Cup & size | Small / Medium / Large (changes volume + price multiplier) |
| 3. Temperature | Hot / Iced / Blended (blended = frappe path with ice + blender mini-interaction) |
| 4. Espresso / Matcha | Choose shots (0–4) with a "pull the shot" tap-and-hold animation, or matcha scoops |
| 5. Milk | Whole, Skim, Oat, Almond, Soy, Coconut → pour animation fills cup layer |
| 6. Sweeteners & syrups | Sugar, brown sugar, honey, vanilla, caramel, hazelnut, etc. with pump counter (0–5) |
| 7. Toppings | Whipped cream, caramel/chocolate drizzle, cocoa/cinnamon powder, cookie crumbs, marshmallows |
| 8. Finish | Stir / shake animation, name your drink, optional notes |
| 9. Review | "Your masterpiece" card with the rendered cup, full ingredient list, stats, price, **Add to basket** |

Behaviors:
- **Live cup preview:** layered SVG (base liquid color, milk layer, ice cubes, foam, whipped cream, drizzle). Layers animate in as ingredients are added; colors computed from ingredient `color` fields.
- **Back/forward** between steps without losing choices; **Reset**.
- **Validation:** drink must have a base and size; at least one "flavor" source (espresso/matcha/etc.) unless the base is a non-coffee base.
- **Prefill** from `/menu` presets and from "Reorder" in My Orders.
- Plenty of tactile feedback (small bounce, sound optional + muted by default).

### 6.3.1 Live Stats Panel (updates on every change)
- **Caffeine** (mg) with level label: None / Low (< 50) / Medium (50–150) / High (150–300) / Very High (> 300 mg) and a gauge bar. Show a gentle note above ~400 mg per drink.
- **Sweetness** 1–5 (derived from sugar grams) shown as cubes/dots.
- **Calories** (kcal), **Sugar** (g), **Size** (oz/ml), **Temperature**, optional **Milk type**.
- Dietary tags auto-derived: Dairy-free, Vegan-friendly (no honey/whipped cream), Contains nuts (almond/hazelnut).
- Numbers are **approximate**; show "Approximate values" footnote.

### 6.4 Pricing
```
itemPrice = (basePrice + sizeUpcharge
           + Σ(ingredient.price × quantity)
           ) 
lineTotal = itemPrice × quantity
subtotal  = Σ lineTotal
total     = subtotal + deliveryFee (if delivery) − discount (Phase 2) + tax (if configured)
```
- Prices stored as **integer minor units** (centavos), never floats.
- Live price shown on the builder (sticky footer on mobile) with animated breakdown on tap ("Espresso ×2 ₱40 · Oat milk ₱25 …").
- **Server recomputes price** from DB at add-to-basket and at checkout. The client price is display-only.
- Price snapshot saved on `order_items` so later menu price changes don't alter past orders.

### 6.5 Basket / Cart
- **Add to basket** returns to a toast "Added! Build another?" with buttons **Build another** and **View basket**.
- Basket shows each custom drink (thumbnail of the rendered cup, name, key ingredients, stats chips, price), quantity stepper, **Edit** (reopens builder prefilled), **Duplicate**, **Remove**.
- Navbar badge shows total item count; basket persists (DB for logged-in users, localStorage fallback during the session).

### 6.6 Final Review Before Checkout
- `/cart` and `/checkout` show the **final cup render** and stats for every drink, plus totals. Customer must confirm each item (or "Confirm all") before **Place order**.

### 6.7 Checkout: Pickup vs Delivery
- Toggle **Pickup / Delivery**.
  - **Pickup:** choose store (single default store for MVP) and time slot (ASAP or 15-min slots, min prep time config).
  - **Delivery:** address form (saved addresses selectable), contact number, delivery notes, flat delivery fee (configurable), minimum order optional.
- Payment (MVP): Cash on pickup / Cash on delivery. Order is created with status `pending`.
- Order confirmation page with order number, summary, and status timeline.

### 6.8 My Orders
- List with status chips: `pending → preparing → ready → out_for_delivery → completed` / `cancelled`.
- Detail page shows each drink's render + stats, fulfilment info, totals; **Reorder** button.
- Status updates in MVP: seeded/manual via a protected admin route (`/admin/orders`, role `admin`) — minimal table with a status dropdown. Real-time updates (polling every 15s) on the detail page.

### 6.9 Profile
- Edit name, phone; manage saved addresses; sign out; delete account (Phase 2).

---

## 7. Data Model (Drizzle / Postgres)

Better Auth manages `user`, `session`, `account`, `verification` (generate with its CLI; add `role` and `phone` fields to `user`).

```
ingredient_category  enum: base | size | milk | espresso | matcha | sweetener | syrup | topping | ice | flavor

ingredient
  id, slug (unique), name, category, price_cents int,
  caffeine_mg int default 0, sugar_g numeric default 0, calories int default 0,
  color text (hex for rendering), is_dairy bool, is_vegan bool, has_nuts bool,
  max_qty int default 1, is_active bool, sort_order int

drink_preset            -- /menu items
  id, slug, name, description, image_url, base_price_cents, category, is_active

drink_preset_ingredient
  preset_id, ingredient_id, quantity

size_option
  id, name (S/M/L), volume_ml, price_cents_upcharge, multiplier numeric

cart  (id, user_id, updated_at)
cart_item
  id, cart_id, name, size_id, temperature enum(hot|iced|blended), notes,
  quantity, config_json (validated builder snapshot), unit_price_cents,
  caffeine_mg, sugar_g, calories, sweetness_level, preview_svg text null

order
  id, number (human-friendly, unique), user_id, status, fulfilment enum(pickup|delivery),
  pickup_time timestamptz null, address_json null, contact_phone,
  subtotal_cents, delivery_fee_cents, total_cents, payment_method, notes, created_at

order_item  (snapshot of cart_item + name + unit_price_cents + stats + config_json)
saved_address (id, user_id, label, line1, line2, city, postal_code, notes)
```
Indexes: `order(user_id, created_at desc)`, `ingredient(category, is_active)`.

### Seed data (starter menu — adjust prices freely; all PHP)

| Category | Items (price) |
|---|---|
| Size | Small 12oz (+₱0) · Medium 16oz (+₱20) · Large 22oz (+₱40) |
| Bases | Espresso Base ₱80 · Frappe Base ₱110 · Matcha Base ₱120 · Iced Coffee Base ₱90 |
| Espresso | Extra shot ₱35 (≈ 63 mg caffeine) · Decaf shot ₱35 (≈ 3 mg) |
| Matcha | Matcha scoop ₱30 (≈ 35 mg) |
| Milk | Whole ₱0 · Skim ₱0 · Oat ₱30 · Almond ₱30 · Soy ₱25 · Coconut ₱30 |
| Sweeteners/Syrups | White sugar ₱0 · Brown sugar ₱10 · Honey ₱15 · Vanilla ₱20 · Caramel ₱20 · Hazelnut ₱20 · Mocha ₱25 |
| Toppings | Whipped cream ₱25 · Caramel drizzle ₱15 · Choco drizzle ₱15 · Cocoa dust ₱10 · Cookie crumbs ₱20 · Marshmallows ₱20 |
| Extras | Extra ice ₱0 · Foam ₱0 |

Preset menu: Caffè Latte, Cappuccino, Americano, Mocha Latte, Caramel Frappe, Mocha Frappe, Matcha Latte, Iced Matcha, Vanilla Iced Latte.
Caffeine/sugar/calorie numbers are **approximations** for display only; note this in UI and README.

---

## 8. API / Server Layer

Use Server Actions or Route Handlers (pick one pattern and stay consistent). All inputs validated with Zod; all mutating endpoints authenticated.

| Endpoint | Purpose |
|---|---|
| `GET /api/ingredients` | Active ingredients grouped by category (cached, revalidate on change) |
| `GET /api/presets` | Menu presets |
| `POST /api/pricing/quote` | Server-side price + stats for a builder config (used for add-to-basket validation) |
| `GET/POST/PATCH/DELETE /api/cart` | Cart operations |
| `POST /api/orders` | Create order from cart (recompute everything server-side, in a transaction) |
| `GET /api/orders`, `GET /api/orders/[id]` | List/detail, scoped to current user |
| `PATCH /api/admin/orders/[id]` | Admin status change (role check) |

Shared pure functions in `src/lib/coffee/` (`calculatePrice`, `calculateStats`, `validateConfig`) used by both client preview and server → single source of truth, unit-tested.

---

## 9. Project Structure

```
/
├─ src/
│  ├─ app/
│  │  ├─ (public)/ page.tsx, login/, signup/
│  │  ├─ (app)/ welcome/, home/, menu/, build/, cart/, checkout/, orders/, profile/, admin/
│  │  ├─ api/auth/[...all]/route.ts   (Better Auth handler)
│  │  └─ layout.tsx, globals.css
│  ├─ components/ ui/, nav/, builder/, cup/, truck/, cart/, orders/
│  ├─ lib/ auth.ts, auth-client.ts, db/ (index.ts, schema.ts), coffee/, validators/, utils.ts
│  ├─ stores/ builder.ts, cart.ts
│  └─ middleware.ts
├─ drizzle/            (migrations)
├─ scripts/seed.ts
├─ tests/ unit/, e2e/
├─ .github/workflows/ci.yml
├─ .env.example
├─ drizzle.config.ts
├─ CONTEXT.md          (handoff file, keep updated)
└─ README.md
```

---

## 10. Environment Variables (`.env.example`)

```
DATABASE_URL=                 # Neon pooled connection string (from Vercel Storage)
DATABASE_URL_UNPOOLED=        # for migrations
BETTER_AUTH_SECRET=           # long random string (openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_NAME=Brew Your Own
NEXT_PUBLIC_CURRENCY=PHP
DELIVERY_FEE_CENTS=5000
MIN_PREP_MINUTES=15
```
Never commit real secrets. Set separate values for Preview and Production on Vercel. Google OAuth redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`.

---

## 11. Setup Guide (GitHub → Vercel → Neon)

1. **Create the repo on GitHub** (`brew-your-own`, private or public), add `.gitignore` (Node), MIT license optional.
2. **Scaffold:** `npx create-next-app@latest` (TypeScript, Tailwind, App Router, ESLint, `src/` dir) → push to `main`.
3. **Branching:** `main` is protected (PR + passing CI). Work on `feat/*` branches; **Conventional Commits** (`feat:`, `fix:`, `chore:`).
4. **Vercel:** Import the GitHub repo → every PR gets a Preview URL; `main` deploys to Production.
5. **Neon:** In the Vercel project → **Storage** → add **Neon (Postgres)** → env vars are injected automatically. Run `vercel env pull .env.local` to use locally.
6. **Google OAuth:** Google Cloud Console → OAuth consent screen + OAuth client (Web) → add redirect URIs (§10) → add keys to Vercel env.
7. **Migrations:** `drizzle-kit generate` + `drizzle-kit migrate` (run in CI/deploy step or manually against Neon); `npm run db:seed` for starter data.
8. **CI (`ci.yml`):** install → lint → typecheck → unit tests → build. Optional Playwright smoke on preview.

---

## 12. Industry-Standard Checklist

**Code quality**
- [ ] TypeScript `strict`, no `any` without comment
- [ ] ESLint + Prettier + Husky/lint-staged
- [ ] Zod validation on every boundary; shared schemas
- [ ] Money in integer cents; pure, unit-tested pricing/stats functions
- [ ] Database transactions for order creation

**Security**
- [ ] Better Auth secure cookies, CSRF protection (built-in), rate limiting on auth + order endpoints
- [ ] Server-side authorization on every order/cart read (users only access their own)
- [ ] Admin routes gated by role
- [ ] Security headers (CSP, X-Frame-Options, etc.) in `next.config`
- [ ] No secrets in repo; `.env.example` only; dependency audit (`npm audit`, Dependabot)

**UX / Accessibility / Performance**
- [ ] WCAG 2.1 AA contrast, keyboard navigation, focus states, ARIA on custom controls (drag-and-drop **must** have tap/keyboard alternative)
- [ ] Lighthouse ≥ 90 (Perf/A11y/Best Practices/SEO) on landing and build pages
- [ ] `next/image`, `next/font`, route-level code splitting, lazy-load heavy animation
- [ ] Reduced-motion support
- [ ] Responsive tested at 360px, 768px, 1280px+

**Reliability**
- [ ] Error boundaries (`error.tsx`, `not-found.tsx`, `loading.tsx`)
- [ ] Structured logging; Vercel Analytics / Speed Insights; optional Sentry
- [ ] Unit tests (pricing, stats, validation), e2e smoke (signup → build → add → checkout)
- [ ] README with setup, scripts, architecture, and env docs

---

## 13. Out of Scope for MVP (Phase 2+)

Online payments (e.g., Stripe, or PayMongo / GCash for the Philippines), live delivery tracking, promo codes/loyalty, email/SMS notifications, password reset emails, multi-store, full admin dashboard, ingredient management UI, dark mode, saved favorite recipes, social sharing of creations, i18n.

---

## 14. Build Phases (each = one small, self-contained prompt)

Work in these phases so **each chat stays small** and never runs out of room. At the end of each phase, update `CONTEXT.md`, commit, push.

| Phase | Deliverable | Done when |
|---|---|---|
| **Discovery** | Answer the §0 questions; decisions logged in `CONTEXT.md` | Summary confirmed by the person |
| **0. Foundation** | Repo, Next.js + Tailwind + TS, lint/format/CI, design tokens, folder structure, `.env.example`, README skeleton | `npm run build` passes on Vercel |
| **1. Layout & Nav** | Root layout, responsive navbar (desktop + mobile drawer/bottom bar), page shells with placeholder content | All routes navigable on mobile + desktop |
| **2. DB & Seed** | Neon connected, Drizzle schema + migrations, seed script (ingredients, sizes, presets) | `db:seed` populates; `/api/ingredients` returns data |
| **3. Auth** | Better Auth (email/password + Google), login/signup pages, middleware route protection, session in navbar/profile | Sign up, log in, Google login, log out all work; protected routes redirect |
| **4. Landing + Truck** | Landing page, `/welcome` truck animation → `/home`, reduced-motion + skip | Smooth on mobile; plays once per login |
| **5. Pricing & Stats engine** | `calculatePrice`, `calculateStats`, `validateConfig` + unit tests + `/api/pricing/quote` | Tests green, edge cases covered |
| **6. Builder UI** | Step flow, live SVG cup, stats panel, price breakdown, review card | Full drink buildable on mobile + desktop |
| **7. Menu & Presets** | `/menu` grid, "Customize" prefill into builder | Preset opens builder with correct ingredients |
| **8. Cart** | Add to basket, cart page, edit/duplicate/remove, navbar badge, persistence | Multiple custom drinks can be held and edited |
| **9. Checkout & Orders** | Pickup/delivery, order creation (transaction), confirmation, My Orders + detail, reorder | Order placed and visible in history |
| **10. Admin (minimal) + Polish** | Admin status page, empty/error states, a11y pass, Lighthouse pass, e2e smoke | Checklist in §12 mostly green |
| **11. Launch** | Production env vars, Google redirect URIs, domain, final QA | Live on Vercel |

---

## 15. Acceptance Criteria (MVP "Done")

1. A new user can sign up with email/password or Google, log in, and sees the truck transition once, then lands on `/home`.
2. The navbar matches §4 on mobile and desktop with a live cart count.
3. A user can build a drink step by step, sees live price, caffeine, sweetness, calories, and a rendered cup.
4. Price shown equals the server-recomputed price at checkout.
5. A user can add several drinks to the basket, edit/duplicate/remove them, review final renders and stats, and check out via pickup or delivery.
6. Orders appear in **My Orders** with status and can be reordered.
7. App is deployed on Vercel with Neon, CI passes, no secrets in the repo, and basic a11y/performance targets are met.

---

## 16. Prompt Template for Each Build Chat

Paste this at the start of every new chat:

```
I'm building the coffee-ordering webapp described in BUILD_SPEC.md.
Current state is in CONTEXT.md (attached below).
Today's task: PHASE <N> only — <phase name>.
FIRST: follow §0 "Ask First" — ask me your discovery/phase questions in small multiple-choice batches
(with recommended defaults) and wait for my answers and a "go" before building anything.
Rules: follow the spec and tech stack, TypeScript strict, small commits, list files created/changed,
and at the end update CONTEXT.md. If you are close to running out of room, stop at a clean
boundary and output the updated CONTEXT.md first.
```
