# FrankyShop

Modern web shop for a houseware retailer in Kariakoo, Dar es Salaam.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Turbopack
- Supabase (Postgres + Auth + Storage)
- Native Next 16 i18n: `app/[lang]/...` with `proxy.ts` locale redirect
- Locales: `en`, `sw`, `hi` (default `en`)
- Hosting: Netlify (`@netlify/plugin-nextjs`)
- Payments: Vodacom M-Pesa Tanzania (Phase 2)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real Supabase + M-Pesa keys
npm run dev -- -p 3010
```

Open http://localhost:3010 — `proxy.ts` redirects `/` to `/en` (or your `accept-language` match).

## Database

Migrations live in `supabase/migrations/`. To apply against a fresh Supabase project:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

## Project tracking

Loom scope **FrankyShop**. Tasks: L-145 (Foundation, this), L-146 Storefront, L-147 Payments, L-148 Admin, L-149 Enhancements, L-150 SEO/Launch.
