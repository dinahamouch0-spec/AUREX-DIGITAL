# AUREX Supplements

Storefront, 3D product stage and admin dashboard for AUREX Supplements —
488 products, 1,563 variants, 107 brands, priced in USD for Lebanon.

Built by AUREX DIGITAL. No framework, no template: plain ES modules rendered
to static HTML at build time, with Netlify Functions behind the commerce.

---

## Running it

```bash
npm install
npm run catalog     # rebuild src/data/catalog.json from data/AUREX_priced.csv
npm run build       # render dist/
npm run dev         # build, then serve dist/ on :4321
```

The API needs a second process in development:

```bash
ADMIN_PASSWORD=choose-something node dev-api.mjs   # :4322
```

Nothing here needs a cloud account to run. Storage falls back to JSON files
under `.data/` when Netlify Blobs is not available.

---

## Layout

```
data/AUREX_priced.csv        the agreed price list — the source of truth
scripts/
  build-catalog.mjs          CSV -> catalogue: groups, brands, staged images
  fetch-images.mjs           pulls supplier images in (run once)
  supplier-images.py         compresses them to WebP
  group-images.py            category scenes -> responsive WebP
  stage-images.py            the 18 photographed product shots
src/
  data/catalog.json          generated — do not edit by hand
  lib/                       routes, formatting, catalogue queries
  components/                layout, product card, mark, icons
  pages/                     home, shop, product, brands, cart, admin
  assets/css/                00-tokens … 08-admin, concatenated in that order
  assets/js/                 bundled by esbuild from app.js
api/
  router.js                  every endpoint
  _lib/                      store, auth, orders, validation
netlify/functions/api.mjs    mounts the router at /api/*
build.mjs                    renders all 609 routes
```

## Changing prices

Prices live in `data/AUREX_priced.csv`. Edit that, then:

```bash
npm run catalog && npm run build
```

The server prices every order from the same catalogue, so the storefront and
the order total can never disagree.

## Adding a photographed product stage

Drop the image in `src/assets/img/products/_incoming/`, add a row to `STAGE`
in `scripts/build-catalog.mjs` naming the product it belongs to, then run
`python3 scripts/stage-images.py && npm run catalog`. An entry that matches no
product fails the build rather than disappearing quietly.

---

## Deploying

Netlify, from Git. `netlify.toml` carries the build settings.

1. **Netlify → Add new site → Import an existing project**, pick this repo.
2. Set the base directory to `aurex-supplements`.
3. **Site configuration → Environment variables**, add:

   | Key | Value |
   |---|---|
   | `ADMIN_PASSWORD` | the admin password — nothing else uses it |
   | `URL` | set automatically by Netlify; used for canonical links |

4. Deploy. `/admin/` is signed out until that password is entered, and is
   excluded from search engines by `netlify.toml` and `robots.txt`.

Orders and settings persist in Netlify Blobs. No database to provision.

---

## Decisions worth knowing

**The ring is CSS, not WebGL.** The products are flat photographs, so a 3D
scene would buy nothing a transform cannot, at the cost of a library. Faces sit
on a cylinder: for n faces of width w, `r = (w/2)/tan(pi/n)`, and the ring
spans `2r + w`. The face width is solved from the measured band at runtime, so
it fits any viewport instead of overflowing into the headline.

**The boot sequence runs once per visit.** 2.5 seconds is a signature moment on
arrival and a toll gate on the fourth product someone opens. The flag is in
`sessionStorage`.

**Prices are decided on the server.** The browser sends variant ids and
quantities. Nothing else about money crosses the wire, so a forged request body
changes nothing.

**Images are self-hosted.** The catalogue arrived pointing at the previous
store's Shopify CDN. All 488 are fetched into the repo and compressed — 103 MB
to 18 MB — because a file someone else deletes would otherwise become a hole on
our shelf.

**The supplied product photographs are composed scenes.** They are used as
photographed, cropped above the repeated logo with faded edges, rather than cut
out: segmentation kept the glass triangle behind each product, and a tighter
crop started clipping the products themselves.

## Known gaps

- **Beauty & Wellness** (22 products) has no category scene; it falls back to
  the vitamins artwork.
- The eighteen product photographs carry generated label text that does not
  match the real packaging. Flagged before they were produced; the decision was
  to finish the set and revisit. Backgrounds and format are fixable here, the
  label text is not — those images need regenerating.
- Admin is read-only over products so far: it lists and searches the catalogue
  but does not yet write back to it. Orders and settings do persist.
