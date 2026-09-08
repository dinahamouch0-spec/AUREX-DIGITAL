# Ya 7kayti | يا حكايتي

Bilingual (Arabic RTL / English LTR) storefront and order system for Ya 7kayti,
which makes personalized children's products — stories, stickers and notebook
covers — from a child's own photo.

**Status: V1 complete.** Storefront, commerce engine and admin dashboard.

---

## Deploying to Netlify

The site needs a server (prices, orders and private photo storage are all
server-side), so it is deployed from Git rather than dragged and dropped.

### 1. Connect the repository

Netlify → **Add new site** → **Import an existing project** → pick this repo.
Netlify reads `netlify.toml`, so build settings are already correct:

| | |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

### 2. Set the admin password

Site configuration → **Environment variables** → add:

| Variable | Value | Required |
|---|---|---|
| `ADMIN_PASSWORD` | a strong password you choose | **yes** — the dashboard stays locked without it |
| `SESSION_SECRET` | any long random string | recommended — signs photo links |
| `ADMIN_USERNAME` | defaults to `admin` | optional |
| `RESEND_API_KEY` | from [resend.com](https://resend.com) | optional — new-order emails |
| `MAIL_FROM` | e.g. `Ya 7kayti <orders@yourdomain.com>` | only with `RESEND_API_KEY` |

Never commit these. They live only in Netlify.

### 3. Enable Blobs

Netlify Blobs stores orders and child photos. It is on by default on current
Netlify plans; if the site was created long ago, enable it under
Site configuration → Blobs. Nothing else to configure — no database to create.

### 4. Deploy, then set the domain

After the first deploy, put the real domain in `src/data/site.js`:

```js
baseUrl: 'https://ya7kayti.com',
```

Canonicals, `hreflang`, the sitemap and Open Graph all derive from it. Commit
and Netlify redeploys automatically.

### 5. Sign in

Go to `https://your-site.netlify.app/admin/` and log in with `admin` and the
password you set. Then open **الإعدادات** and fill in the Instagram link and
business email.

---

## Running locally

```bash
npm install
ADMIN_PASSWORD=choose-something npm run dev   # http://localhost:8899
```

`npm run dev` builds the site and starts a server that routes `/api/*` through
the very same code the Netlify function runs, so local behaviour matches
production. Data goes to `.data/` (git-ignored) instead of Netlify Blobs.

```bash
npm test          # every suite (needs the dev server running)
npm run build     # generate dist/ only
npm run images    # regenerate image variants from the source assets
```

---

## Using the dashboard

`/admin/` — Arabic interface, works on a phone.

| Screen | What you can do |
|---|---|
| نظرة عامة | Counts by status, recent orders, payment follow-ups |
| الطلبات | Search by number/name/phone, filter by status, open any order |
| Order detail | Customer info, WhatsApp contact, the child's photo, set production status, payment status and delivery cost |
| المنتجات | Add/edit products, prices, and the customization fields customers fill in |
| المحتوى | FAQ and reviews |
| الإعدادات | WhatsApp, Whish, Instagram, email, production time, photo retention |

**Nothing here needs a developer.** Adding a product with a completely
different set of fields, or changing any price, takes effect on the storefront
immediately — the customizer builds itself from whatever you configure.

### Order lifecycle

`جديد → قيد التصميم → بانتظار الموافقة → تمت الموافقة → قيد الطباعة → جاهز → تم الشحن → مكتمل`

Design approval happens over WhatsApp, as it does today — there is no customer
approval portal, by design.

Setting an order to **مكتمل** starts the photo deletion clock.

---

## How child photos are protected

This was treated as a release blocker, and is verified by automated tests.

- Stored in **private** Netlify Blobs under a random key. There is no public URL
  for a photo, ever — not even an unguessable one.
- Identified by **magic bytes**, not by filename or the browser's claimed type.
  A PHP script or an SVG renamed to `.jpg` is rejected.
- Reachable only through a **short-lived signed link** (5 minutes) generated
  server-side for a logged-in admin. A copied link stops working when it expires.
- **Deleted automatically** 24 hours after an order is completed. The order,
  its prices and its history all survive; only the image goes.
- Uploads that never became an order are **cleaned up after 48 hours**.
- Both windows are configurable in Settings; an hourly scheduled function does
  the work, and you can also run it on demand.
- **A photo uploaded to fulfil an order is never marketing consent.** The
  portfolio section only ever shows separately approved marketing assets.

---

## Pricing

Prices are always recalculated on the server before an order is created. The
browser's number is compared, never trusted — if it differs, the customer is
told what changed rather than being charged silently.

| Product | Model | Price |
|---|---|---|
| Personalized story | Price set by the chosen age | 1–5 → $20 · 6–12 → $25 |
| Personalized stickers | Per pack of 10, by design mode | 2 designs → $3 · individual → $5 |
| Notebook covers | Per notebook | $2.50 each |

All editable in **المنتجات**. A fourth model, price modifiers ("large +$5"),
is supported and ready to use.

Orders keep an immutable snapshot of names, labels and prices, so changing a
price today never rewrites an order from last week.

---

## Architecture

```
build.mjs                 generates dist/ — every page, both locales
dev-server.mjs            local server; routes /api/* through api/router.js
netlify/functions/
  api.mjs                 the same router, as a Netlify function
  retention.mjs           hourly photo cleanup
api/
  router.js               all HTTP routes
  _lib/  store.js         Netlify Blobs, with a filesystem mirror for dev
         db.js            collections, seeding, settings
         orders.js        cart validation, order creation, snapshots
         validate.js      input sanitising, magic-byte image sniffing
         auth.js          scrypt passwords, sessions, signed photo links
         retention.js     deletion rules
         mail.js          notifications (no-op without a provider)
src/
  data/    site.js · catalog.js · copy.js · content.js
  lib/     pricing.js · routes.js · html.js      ← pricing.js also runs server-side
  components/ · pages/                            static page generation
  assets/  css/ · js/ · fonts/ · img/
tests/     run.mjs · audit.mjs · e2e-*.mjs · all.mjs
video/     Remotion project for promo video — separate build, see video/README.md
```

`src/lib/pricing.js` is pure and is imported by both the browser and the
server, so the two cannot disagree about a price.

### Images

Source assets live in `src/assets/img/*-src.*` and are **not** shipped. The
build emits WebP at 480/768/1100/1536 plus a JPEG fallback, served through
`<picture>`. Aspect ratio is fixed at the assets' native 3:2 and never
distorted. Fonts are self-hosted and subset to Arabic + Latin (~276 KB).

---

## Tests

```bash
npm test
```

| Suite | Covers |
|---|---|
| `run.mjs` | 101 API checks — pricing, uploads, orders, snapshots, retention, auth |
| `audit.mjs` | 1,739 links, accessibility, SEO, RTL, four viewports |
| `e2e-customizer.mjs` | Arabic mobile: personalize → upload → cart, two children |
| `e2e-checkout.mjs` | Checkout → order → confirmation → WhatsApp |
| `e2e-admin.mjs` | Dashboard, product builder, and the private-photo blocker |

All passing.

---

## Deliberately not built (V2)

Customer accounts, coupons, wishlist, loyalty, automated shipping rates,
Stripe/PayPal, an automated Whish gateway, multi-currency, the WhatsApp
Business API, and an online design-approval portal. Shipping and Whish stay
manually coordinated, and nothing in the UI pretends otherwise.

---

## Content still required

Not invented, per Part 1 §37 and Part 3 §99:

- **Instagram URL** and **business email** — add them in Settings
- **Real customer reviews** — the section shows an honest empty state until then
- **The founder's story** for the About page
- **Legal review** of the three policy drafts

WhatsApp and Whish are both set to `+961 3 566434`.
