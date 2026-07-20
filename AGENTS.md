# Splitsy — Agent Context

> **Last updated:** 2026-07-20  
> **Purpose:** Living project brief for Cursor agents. Update this file when architecture, features, or roadmap change.

---

## Project overview

**Splitsy** is a shared expense / bill-splitting web app (branded “Splitsy Digital Atelier”). Users authenticate with Clerk, data lives in Supabase, and the UI is a Next.js App Router app with a custom emerald editorial design system.

**Core flow:** Sign up → auto-sync user to Supabase on first dashboard/API request (`ensureUser`) → add friends by email → log expenses split equally among friends → mark splits as settled.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.7 (App Router, Turbopack dev) |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 4, shadcn/ui (radix-nova), Lucide icons |
| Auth | Clerk (`@clerk/nextjs` v7) |
| Database | Supabase (`@supabase/supabase-js` v2) |
| Webhooks | Svix (Clerk webhook signature verification) |
| Theming | `next-themes` |

---

## Dependencies

### Production (`package.json`)

| Package | Version | Role |
|---------|---------|------|
| `next` | 16.1.7 | App framework |
| `react` / `react-dom` | ^19.2.4 | UI |
| `@clerk/nextjs` | ^7.0.6 | Authentication |
| `@supabase/supabase-js` | ^2.100.0 | Database client |
| `svix` | ^1.89.0 | Webhook verification |
| `class-variance-authority`, `clsx`, `tailwind-merge` | — | Styling utilities |
| `lucide-react` | ^0.577.0 | Icons |
| `next-themes` | ^0.4.6 | Dark/light theme |
| `radix-ui` | ^1.4.3 | Primitives (via shadcn) |
| `shadcn` | ^4.1.0 | Component tooling |
| `tw-animate-css` | ^1.4.0 | Animations |

### Dev

`typescript`, `eslint` + `eslint-config-next`, `prettier` + `prettier-plugin-tailwindcss`, `tailwindcss` + `@tailwindcss/postcss`, `@types/*`

### Scripts

```bash
npm run dev        # next dev --turbopack
npm run build      # production build
npm run start      # production server
npm run lint       # eslint
npm run format     # prettier
npm run typecheck  # tsc --noEmit
```

---

## Folder structure

```
next-app/
├── AGENTS.md                    # This file — agent project context
├── .env.example                 # Required env vars template
├── supabase-migration.sql       # Full DB schema + RLS + indexes
├── middleware.ts                # Clerk middleware (all routes except static)
├── app/
│   ├── layout.tsx               # Root: ClerkProvider, ThemeProvider, fonts
│   ├── page.tsx                 # Landing page (marketing)
│   ├── globals.css              # Tailwind + design tokens
│   ├── sign-in/[[...sign-in]]/  # Clerk SignIn
│   ├── sign-up/[[...sign-up]]/  # Clerk SignUp
│   ├── dashboard/
│   │   ├── layout.tsx           # TopNavbar + FAB; ensureUser sync on load
│   │   ├── page.tsx             # Balance overview, recent activity (SSR)
│   │   ├── expenses/page.tsx    # Expense list, add modal, settle (client)
│   │   ├── friends/page.tsx     # Friends list, add by email (client)
│   │   └── settings/page.tsx    # Clerk UserProfile
│   └── api/
│       ├── friends/route.ts     # GET list, POST add by email
│       ├── transactions/route.ts# GET enriched list, POST create + splits
│       ├── settlements/route.ts # POST mark split paid
│       └── webhooks/clerk/route.ts # Optional Clerk → Supabase user sync
├── components/
│   ├── dashboard/sidebar.tsx    # TopNavbar (desktop + mobile nav)
│   ├── theme-provider.tsx
│   └── ui/button.tsx            # shadcn button (only UI component so far)
├── lib/
│   ├── utils.ts                 # cn() helper
│   └── supabase/
│       ├── admin.ts             # Service-role client (server API routes)
│       ├── client.ts            # Browser anon client (not wired in UI yet)
│       ├── ensure-user.ts       # Upsert Clerk user → Supabase (primary sync)
│       └── database.types.ts    # TS types for tables
└── public/stitch/               # Landing mock assets
```

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk frontend |
| `CLERK_SECRET_KEY` | Server | Clerk backend |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server | Optional — verify Clerk webhooks (`user.deleted` etc.) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/publishable key (browser client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin DB access in API routes |

**Note:** Primary user sync is `ensureUser` — webhook env vars are optional for local/dev.

---

## Database schema (Supabase)

Run `supabase-migration.sql` in Supabase SQL Editor.

| Table | Purpose |
|-------|---------|
| `users` | Synced from Clerk via `ensureUser` on dashboard/API (optional webhook). RLS: authenticated read-all; writes via service role |
| `friends` | Bidirectional rows (A→B and B→A). RLS: user owns their rows |
| `transactions` | Expense records (`creator_id`, `amount`, `description`, `category`) |
| `splits` | Per-person share (`amount_owed`, `is_paid`). Creator inserts; owners/creators can mark paid |
| Indexes | On `friends`, `transactions`, `splits` FK columns |
| Realtime | `splits` and `transactions` added to `supabase_realtime` publication (for future live updates) |

**Split logic:** Equal split among creator + selected friends. Creator pays full amount; friends get `amount / (friends + 1)` owed.

**Categories:** `food`, `travel`, `shopping`, `housing`, `utilities`, `general`

---

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/friends` | Clerk | List friends with user details |
| `POST` | `/api/friends` | Clerk | Add friend by email (bidirectional insert) |
| `GET` | `/api/transactions` | Clerk | List transactions user created or is split on |
| `POST` | `/api/transactions` | Clerk | Create transaction + equal splits |
| `POST` | `/api/settlements` | Clerk | Mark split `is_paid = true` |
| `POST` | `/api/webhooks/clerk` | Svix signature | Optional: sync `user.created/updated/deleted` → `users` |

All authenticated API routes use `getSupabaseAdmin()` (service role), not RLS-scoped client. Primary user sync is `ensureUser()` in `lib/supabase/ensure-user.ts` (dashboard layout + API routes).

---

## Current progress

### Done

- [x] **Landing page** — Full marketing UI at `/` (Splitsy brand, features, CTA, Clerk sign-in)
- [x] **Auth** — Clerk provider, middleware, sign-in/sign-up pages, UserButton
- [x] **Clerk → Supabase sync** — Primary: `ensureUser` on dashboard layout + API routes; optional webhook for deletes/background updates
- [x] **Database migration** — SQL file with tables, RLS policies, indexes, realtime prep
- [x] **Dashboard shell** — Layout, TopNavbar (desktop + mobile bottom nav), FAB placeholder, ensureUser on load
- [x] **Dashboard home** — SSR balance stats (owed/owing/net), recent transactions, empty states
- [x] **Friends page** — List friends, add by email modal, API integration
- [x] **Expenses page** — List transactions with splits, add expense modal (category, equal split), settle button
- [x] **Settings page** — Embedded Clerk `UserProfile`
- [x] **API layer** — friends, transactions, settlements routes
- [x] **Type definitions** — `lib/supabase/database.types.ts`
- [x] **Design system** — Emerald palette (`#006c49`), soft cards, responsive layout

### Partial / known gaps

- [ ] **Dashboard route protection** — Middleware runs Clerk but dashboard pages don't explicitly redirect unauthenticated users
- [ ] **Supabase browser client** — `client.ts` exists but UI uses fetch → API routes only; env key name mismatch
- [ ] **FAB button** — Dashboard layout FAB has no `onClick` / navigation
- [ ] **Landing image** — References `/stitch/landing-page-desktop.png`; repo has `.html` mock only
- [ ] **Currency** — Hardcoded `$` (USD); no multi-currency
- [ ] **Split types** — Only equal split; no custom amounts or percentages
- [ ] **Friend removal** — No DELETE on `/api/friends`
- [ ] **Transaction edit/delete** — Not implemented in API or UI
- [ ] **Tests** — None
- [ ] **README** — Still mostly shadcn template + webhook setup; not full app docs

### Git status (snapshot)

Uncommitted work includes all dashboard, API, Supabase, and migration files listed in initial project setup.

---

## Architecture notes

```
User → Clerk Auth → Next.js pages/API
                         ↓
              ensureUser() + getSupabaseAdmin()
                         ↓
                    Supabase Postgres
                         ↑
              Optional Clerk webhook (deletes / background sync)
```

- **User sync:** `lib/supabase/ensure-user.ts` upserts from `currentUser()` — no ngrok required locally
- **Server components:** Dashboard home uses `currentUser()` + admin client directly; layout runs `ensureUser`
- **Client components:** Expenses, Friends use `fetch('/api/...')` with Clerk session cookies (APIs call `ensureUser`)
- **Security:** Service role key must never be exposed client-side; webhook signing secret only needed if webhook is enabled

---

## Design conventions

- Brand color: `#006c49` (primary emerald)
- Background: `#f7f9fb`, text: `#2a3439`, muted: `#566166`
- Components: rounded-xl/2xl cards, subtle shadows, uppercase micro-labels
- Icons: Lucide, category-mapped on transactions
- Path alias: `@/` → project root (see `tsconfig.json`)

---

## Future roadmap (not started)

> Placeholder for planned features. Move items to **Current progress** when implemented.

### Phase 2 — Core product

- [ ] Protected dashboard routes (`auth()` redirect)
- [ ] Remove friend + unfriend flow
- [ ] Edit / delete transactions
- [ ] Custom split amounts (unequal splits)
- [ ] Wire dashboard FAB to add-expense flow
- [ ] Friend search UX (autocomplete vs raw email)
- [ ] Notifications / “gentle nudges” for unpaid splits

### Phase 3 — Realtime & settlements

- [ ] Supabase Realtime subscriptions on `splits` / `transactions`
- [ ] Smart reciprocal settlement (minimize payment graph — mentioned on landing)
- [ ] Settlement history / audit log

### Phase 4 — Groups & scale

- [ ] Expense groups (trips, rent, events) — separate ledgers
- [ ] Group invites and roles
- [ ] Multi-currency with exchange rates (landing feature promise)

### Phase 5 — Polish & ops

- [ ] Full shadcn component set (forms, dialogs, toasts)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline
- [ ] Production deployment docs (Vercel + Clerk webhook URL)
- [ ] Error monitoring (Sentry)
- [ ] PWA / mobile app considerations

### Infrastructure

- [ ] Align Supabase env var naming (`ANON_KEY` vs `PUBLISHABLE_DEFAULT_KEY`)
- [ ] Consider RLS-scoped Supabase client with Clerk JWT instead of service role in all API routes
- [ ] Generate types from Supabase CLI (`supabase gen types`)

---

## Agent maintenance instructions

**When to update this file:**

1. A new feature is added or completed → move from **Future roadmap** to **Current progress**
2. Dependencies change → update **Dependencies** table
3. New API route or table → update **API routes** / **Database schema**
4. Folder structure changes → update **Folder structure**
5. Architecture decision changes → update **Architecture notes**

**How:** Edit `AGENTS.md` in the same PR/session as the code change. Bump **Last updated** date at the top.

**Do not:** Duplicate large code blocks here — reference file paths (e.g. `app/api/transactions/route.ts`) instead.
