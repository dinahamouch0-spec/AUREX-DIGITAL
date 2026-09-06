# Ya 7kayti | يا حكايتي — Storefront

Bilingual (Arabic RTL / English LTR) storefront for Ya 7kayti, which makes
personalized children's products — stories, stickers and notebook covers — from
a child's own photo.

**Status: Part 1 of 3 complete.** See [Project status](#project-status).

---

## Quick start

```bash
npm run build      # generates dist/
npm run preview    # serves dist/ at http://localhost:8899
```

No dependencies are needed to build. Node 18+ only.

## Deploying

`dist/` is plain static files — no server, no build step at deploy time.

**Netlify (drag & drop)** — build, then drag the `dist` folder onto
<https://app.netlify.com/drop>. Live in seconds, no account required.

**Netlify (from Git)** — connect the repo and set:
- Build command: `npm run build`
- Publish directory: `dist`

`_redirects` and `_headers` in `dist/` are picked up automatically: localized
404s, immutable caching for `/assets/*`, revalidated HTML.

**GitHub Pages** — push `dist/` to a `gh-pages` branch, or set Pages to serve
`/dist` from main. Add a `.nojekyll` file so `_headers` isn't stripped.

### Before launch

Set the real domain in `src/data/site.js`:

```js
baseUrl: 'https://ya7kayti.com',
```

Canonicals, `hreflang` and the sitemap are all derived from it.

---

## Configuration

Everything an owner changes lives in two files — no component edits needed.

### `src/data/site.js` — business settings

| Key | Status |
|---|---|
| `whish` | `009613566434` (supplied) |
| `productionDays` | 2–5 days (**production**, not delivery) |
| `currency` | USD only |
| `whatsapp` | **CONTENT REQUIRED** — `null` |
| `instagram` | **CONTENT REQUIRED** — `null` |
| `email` | **CONTENT REQUIRED** — `null` |

Unset values degrade gracefully: WhatsApp CTAs are replaced with a link to the
contact page, and the footer shows "contact channels will be added soon" rather
than a dead link. Fill them in and every CTA across both locales activates.

### `src/data/catalog.js` — products, pricing, customization fields

Products define their own fields, options and pricing behaviour. Nothing in the
rendering code branches on a product slug, so a new product with a different set
of fields needs no code change.

Pricing models supported:

| Model | Used by | Behaviour |
|---|---|---|
| `unit` | Notebook covers | `basePrice × quantity` — $2.50 each |
| `option_override` | Stories | Selected option replaces the price — 1–5 → $20, 6–12 → $25 |
| `option_override` | Stickers | Per pack of 10 — 2 designs → $3, individual → $5 |
| `priceModifier` | (ready) | Adds to the base, e.g. "large +$5" |

Other content: `src/data/copy.js` (all UI strings, both locales),
`src/data/content.js` (FAQ, portfolio, reviews, policy pages).

---

## Architecture

```
build.mjs              generates dist/ — every page, both locales
src/
  data/       site.js · catalog.js · copy.js · content.js
  lib/        pricing.js · routes.js · html.js
  components/ layout.js · sections.js · ui.js · icons.js
  pages/      index.js — one builder per page type
  assets/     css/ (numbered, concatenated) · js/app.js · fonts/ · img/
```

`src/lib/pricing.js` is pure and dependency-free, so the same module can run
server-side in Part 2 — client and server cannot disagree on a price.

### Images

Source assets live in `src/assets/img/*-src.*` and are **not** shipped. The
build emits WebP at 480/768/1100/1536 plus a JPEG fallback, served through
`<picture>` with `sizes`. Aspect ratio is fixed at the assets' native 3:2 and
never distorted; width/height are always reserved to avoid layout shift.

To regenerate after replacing a source asset:

```bash
pip install Pillow
python3 scripts/build-images.py
```

### Fonts

Self-hosted in `src/assets/fonts/` (Baloo Bhaijaan 2, Cairo, Nunito), subset to
Arabic + Latin, ~276 KB total. No third-party request at render time. Each
locale preloads only the two faces it actually uses.

---

## Project status

### Part 1 — complete

Brand system derived from the supplied logo and assets · bilingual AR/EN with
real RTL · branded loader · homepage (12 sections) · shop · 3 category pages ·
3 product pages · how it works · about · contact · FAQ · 3 policy pages · cart
shell · localized 404s · sitemap · robots · hreflang · Open Graph.

Verified: 35 pages, 1,585 internal links, 0 broken. No horizontal overflow
across 7 viewports × 11 pages. No console errors. Loader shows, dismisses, and
skips on repeat navigation. Reduced motion fully respected.

### Parts 2 & 3 — not built

The commerce engine (server-side pricing, cart, checkout, orders) and the Admin
Dashboard (auth, private child-photo storage, retention/deletion) **require a
server, a database and private object storage.** Static hosting cannot provide
them:

- Part 2 §6 — final price must be recalculated server-side
- Part 2 §30 — a server flow creates the order
- Part 2 §36–39 — relational data with immutable order snapshots
- Part 3 §30 — child photos must never be publicly readable
- Part 3 §28 — authenticated admin access

What is already in place for them: the pricing engine is configuration-driven
and passes every Part 2 §58 case; the product page renders its field checklist
from configuration and has a mount point (`#customizer`) for the customizer; the
cart page has a `[data-cart-root]` container; the header cart badge reads
`localStorage.yk_cart`. Recommended next step is Next.js + Postgres + private
blob storage, reusing this markup and CSS.

### Content still required

Not invented, per Part 1 §37 and Part 3 §99:

- WhatsApp number, Instagram URL, business email
- Real customer reviews — the section renders an honest empty state
- Owner's founder story for the About page
- Legal review of the three policy drafts
