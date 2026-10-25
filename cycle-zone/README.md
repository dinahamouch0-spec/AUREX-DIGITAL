# Cycle Zone — by Rashed Khalifeh

Website for **Cycle Zone**, a motorcycle showroom on Sarafand Main Road, between Saida and Tyre.
It's in Arabic (RTL, the default) and English, with a toggle in the header.

Static site with no build step: open `index.html` or upload this folder to any host
(Netlify drag-and-drop, GitHub Pages, cPanel…).

## Adding motorcycles and parts

Everything lives in **`assets/js/data.js`**:

- **New motorcycle** → copy an object in `bikes`, change `id`, `name`, `category`
  (`scooter` / `maxi` / `electric`), `specs`, and put the photo in `assets/img/`.
  `price: 800` shows the price; `price: null` shows "Ask for the price".
  `featured: true` gives it a large card (keep this to one bike).
- **New part / accessory** → copy an object in `parts`. `icon` is one of:
  helmet, mirror, windshield, seat, backrest, panel, bulb, tire, rim, shock, oil, wrench.
  Add `image: 'assets/img/….webp'` to show a photo instead of the icon.
- **New category** → add it to `bikeCategories` or `partCategories`. The filter buttons build themselves.

Every WhatsApp button opens a pre-filled message to +961 76 533 092.
