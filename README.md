# Ya 7kayti | يا حكايتي

Personalized children's products (stories, stickers, notebook covers) built
with your child's real photo. Bilingual (Arabic RTL / English LTR),
mobile-first, with a configuration-driven commerce engine and an Admin
Dashboard the owner can run the business from without touching code.

## Tech stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS v4
- **PostgreSQL** via **Prisma 6**
- **next-intl** for `/ar` and `/en` routing, RTL/LTR
- **Zustand** for the client-side cart
- Custom JWT admin auth (`jose` + `bcryptjs`) — no third-party auth service
- **S3-compatible object storage** (AWS S3 / Cloudflare R2 / Backblaze B2) for
  private child photos — never `/public`, never a permanent public URL
- **Resend** for transactional email
- Deploys to **Vercel** (serverless functions + Vercel Cron for cleanup jobs)

## Local setup

```bash
npm install
cp .env.example .env
# fill in .env — see "Environment variables" below
npm run db:migrate   # creates tables
npm run db:seed      # seeds categories, the 3 initial products, an admin user
npm run dev
```

Visit `http://localhost:3000/en` (or `/ar`). Admin: `http://localhost:3000/admin/login`
using the `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from your `.env`.

### Testing photo uploads locally

Child photo upload needs an S3-compatible bucket. For local development
only, this repo includes a tiny local S3-compatible server:

```bash
npm run dev:storage   # runs on :4569, storage lives in .s3rver-data/ (gitignored)
```

Then point `.env` at it:

```
STORAGE_ENDPOINT="http://localhost:4569"
STORAGE_ACCESS_KEY_ID="S3RVER"
STORAGE_SECRET_ACCESS_KEY="S3RVER"
STORAGE_REGION="us-east-1"
```

**This local server does not enforce bucket privacy the way a real
provider does — do not use it in production.** See "Security notes" below.

## Environment variables

See `.env.example` for the full list with inline comments. Summary:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `ADMIN_SESSION_SECRET` | yes | Long random string; signs admin session JWTs |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | for seeding | Only used by `db:seed` |
| `NEXT_PUBLIC_BASE_URL` | yes | Public site URL, used in metadata/sitemap/emails |
| `STORAGE_ENDPOINT` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` / `STORAGE_BUCKET` | yes | S3-compatible provider for private child photos |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional | Order emails are skipped (logged, not failed) if unset |
| `CRON_SECRET` | yes in production | Protects `/api/cron/cleanup-photos` |

## Database

```bash
npm run db:migrate    # dev migrations
npm run db:deploy     # apply migrations in production (CI/CD)
npm run db:seed       # seed initial data (idempotent — safe to re-run)
```

Seeded data: 3 categories (Stories, Stickers, Notebook Covers), the 3
initial products with their real pricing rules, an admin user, and the FAQ
+ Previous Creations content using the 3 approved promotional images.
`whatsappNumber`, `instagramUrl`, and `businessEmail` are left blank —
configure those in Admin → Settings.

## Deploying to Vercel

1. Push this repo to GitHub, then **Import Project** on
   [vercel.com/new](https://vercel.com/new).
2. Add the environment variables listed above in the Vercel project
   settings (Production + Preview).
3. Provision a Postgres database (Vercel Postgres, Neon, or Supabase all
   work) and set `DATABASE_URL`.
4. Provision an S3-compatible bucket (Cloudflare R2 is a good fit — no
   egress fees) for child photos. **Confirm the bucket is private** — no
   public-read bucket policy, "Block Public Access" on if using AWS S3.
5. Set `CRON_SECRET` to a random string — `vercel.json` already declares an
   hourly cron job hitting `/api/cron/cleanup-photos`, and Vercel
   automatically sends `Authorization: Bearer $CRON_SECRET` on its own cron
   invocations once that env var is set.
6. First deploy will run `prisma generate && next build`. After it's live,
   run migrations against the production database once:
   ```bash
   DATABASE_URL="<production-url>" npm run db:deploy
   DATABASE_URL="<production-url>" npm run db:seed
   ```
7. Log into `/admin/login` with the seeded admin account and go to
   **Settings** to fill in the WhatsApp number, Instagram URL, and business
   email — these were intentionally left blank rather than invented.

## Deploying to Netlify

`netlify.toml` is already in the repo (build command + the official
`@netlify/plugin-nextjs` runtime), so Netlify auto-detects everything.

1. Push this repo to GitHub, then on [app.netlify.com](https://app.netlify.com)
   click **Add new site → Import an existing project**, pick this repo and
   the `claude/website-build-ra9nu1` branch. Netlify reads `netlify.toml`
   automatically — no build settings to fill in.
2. **Database**: in the new site's dashboard, go to the **Netlify DB**
   extension and enable it — it provisions a Postgres database for you (no
   separate signup) and gives you a connection string. Copy that value into
   a `DATABASE_URL` environment variable in **Site configuration →
   Environment variables** (Netlify DB's own variable is named
   `NETLIFY_DATABASE_URL` — Prisma needs it under the name `DATABASE_URL`).
3. Add the rest of the environment variables from `.env.example`
   (`ADMIN_SESSION_SECRET`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`,
   `NEXT_PUBLIC_BASE_URL` — use the `.netlify.app` URL Netlify gives you,
   `STORAGE_*` for child photo storage, `CRON_SECRET`).
4. Provision an S3-compatible bucket for child photos exactly as described
   in step 4 of the Vercel instructions above (Cloudflare R2 is the
   simplest — confirm it's private).
5. Deploy. After it's live, run migrations + seed once, same as the Vercel
   steps:
   ```bash
   DATABASE_URL="<netlify-db-connection-string>" npm run db:deploy
   DATABASE_URL="<netlify-db-connection-string>" npm run db:seed
   ```
6. Log into `/admin/login` and fill in Settings, same as step 7 above.

**Note on the cleanup cron job**: Netlify doesn't read `vercel.json`, so the
hourly child-photo-retention sweep isn't automatically scheduled there yet.
`/api/cron/cleanup-photos` still works as a normal endpoint — the simplest
fix is a free external scheduler (e.g. [cron-job.org](https://cron-job.org))
hitting it hourly with an `Authorization: Bearer <CRON_SECRET>` header.
This doesn't block launch — no photos are ever exposed publicly regardless;
it only delays when old ones get cleaned up.

## Project structure

```
prisma/schema.prisma       Data model (products are fully config-driven —
                            no "Story"/"Sticker"/"Notebook" tables)
prisma/seed.ts              Initial categories/products/settings/admin
src/lib/pricing.ts           Generic pricing engine (fixed / unit / per-field
                            price override / price unit / price modifier)
src/lib/storage.ts           Private S3-compatible storage abstraction
src/lib/auth.ts               Admin session (JWT) + password hashing
src/middleware.ts             Locale routing (next-intl) + admin auth gate
src/app/[locale]/...          Public bilingual storefront
src/app/admin/...             Admin Dashboard (English, not localized)
src/app/api/...                Route handlers (orders, uploads, cron, admin)
src/components/marketing/     Homepage sections
src/components/commerce/       Product cards, customizer, cart, checkout
src/components/admin/          Admin Dashboard UI
```

## How the pricing engine works

No component ever branches on "is this a story / sticker / notebook".
Each `CustomizationField` carries a `pricingRole`:

- `quantity` — the field's numeric value multiplies the unit price
- `price_override` — the selected option's price replaces the product's
  total price (used by Stories: age 1–5 → $20, age 6–12 → $25)
- `price_unit` — the selected option's price becomes the per-unit price
  (used by Stickers: design type sets $3 or $5 per pack of 10)
- `price_modifier` — the selected option's price is added/subtracted from
  the total (for future use, e.g. "Large size +$5")

Notebook Covers just use the product's own flat `unitPriceCents` × a
`quantity` field — no field-level override needed. Adding a brand-new
product type (with its own fields, options, and pricing) is entirely an
Admin Dashboard operation — verified end-to-end during QA by creating a
throwaway "Bookmark" product with a custom `select` field and confirming it
rendered and priced correctly on the live storefront before being removed.

## Security notes

- Child photos live in private object storage only. The only way to read
  one is `/api/admin/order-items/[itemId]/photo`, which re-checks the admin
  session server-side on every call and returns a 5-minute signed URL.
  Verified during QA: unauthenticated requests to that endpoint return 401.
- **Caveat**: the local `s3rver` dev tool does not enforce bucket privacy
  the way AWS S3 / Cloudflare R2 do by default, so the "raw URL without a
  signature is denied" behavior could only be confirmed against the local
  mock's own (permissive) behavior, not a real bucket. **Before launch,
  repeat that exact check against the real production bucket**: copy a
  signed URL, strip its query string, confirm the bare object URL 403s.
- Admin auth: bcrypt-hashed passwords, HttpOnly/Secure/SameSite session
  cookies, login rate-limiting (8 failed attempts / 15 min / email+IP).
- Order confirmation pages are keyed by an opaque token, not the friendly
  `YK-1042` order number — guessing an order number does not grant access.
- All admin API routes independently re-check the session server-side
  (never rely on a hidden URL as authorization).

## What's deferred to a later version

Per the original spec: customer accounts, coupons/loyalty, automated
shipping-rate or Whish payment APIs, an online design-approval portal,
multi-currency, and WhatsApp Business API integration are all intentionally
out of scope for this build.
