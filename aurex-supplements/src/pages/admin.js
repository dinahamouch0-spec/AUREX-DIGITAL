import { count } from '../lib/format.js';
import { products, groups, brands } from '../lib/catalog.js';
import { icons } from '../components/icons.js';

/* The dashboard shell renders empty and fills from the API, so the same page
   serves the signed-out state without a second template. Nothing here trusts
   the browser: every view re-fetches, and every write goes through the API,
   which checks the session. */
export const adminPage = () => {
  const variants = products.reduce((n, p) => n + p.variants.length, 0);
  const value = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.price, 0), 0);

  return `
<div class="admin" id="admin">

  <section class="alogin" id="alogin">
    <form class="alogin__box" id="login-form">
      <h1 class="chrome">AUREX Admin</h1>
      <p>Sign in to manage products, prices and orders.</p>
      <label for="pw">Password</label>
      <input type="password" id="pw" autocomplete="current-password" required>
      <button class="btn" type="submit">Sign in</button>
      <p class="alogin__err" id="login-err" role="alert" hidden></p>
    </form>
  </section>

  <div class="ashell" id="ashell" hidden>
    <aside class="aside">
      <div class="aside__brand"><b class="chrome">AUREX</b><span>Admin</span></div>
      <nav class="aside__nav">
        <button data-view="overview" class="is-on">${icons.bolt} Overview</button>
        <button data-view="products">${icons.filter} Products</button>
        <button data-view="prices">${icons.bolt} Prices</button>
        <button data-view="orders">${icons.cart} Orders</button>
        <button data-view="settings">${icons.shield} Settings</button>
      </nav>
      <button class="aside__out" id="logout">Sign out</button>
    </aside>

    <div class="amain">
      <section class="aview" data-view="overview">
        <h2 class="chrome">Overview</h2>
        <div class="astats">
          <div class="astat"><span>Products</span><b>${count(products.length)}</b></div>
          <div class="astat"><span>Variants</span><b>${count(variants)}</b></div>
          <div class="astat"><span>Brands</span><b>${count(brands.length)}</b></div>
          <div class="astat"><span>Categories</span><b>${count(groups.length)}</b></div>
          <div class="astat"><span>Catalogue value</span><b>$${Math.round(value).toLocaleString('en-US')}</b></div>
          <div class="astat"><span>Orders today</span><b id="s-orders">—</b></div>
        </div>
        <div class="apanel">
          <h3>Recent orders</h3>
          <div id="recent">Loading…</div>
        </div>
      </section>

      <section class="aview" data-view="products" hidden>
        <h2 class="chrome">Products</h2>
        <div class="atools">
          <input type="search" id="p-q" placeholder="Search ${count(products.length)} products…">
          <select id="p-group">
            <option value="">All categories</option>
            ${groups.map((g) => `<option value="${g.slug}">${g.name}</option>`).join('')}
          </select>
          <span class="atools__n" id="p-n"></span>
        </div>
        <div class="atable-wrap"><table class="atable" id="p-table">
          <thead><tr><th>Product</th><th>Brand</th><th>Options</th><th class="r">Price</th><th class="r">Stock</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <p class="ahint">Editing writes through the API and takes effect on the next deploy of the catalogue.</p>
      </section>

      <section class="aview" data-view="prices" hidden>
        <h2 class="chrome">Prices</h2>
        <p class="ahint">A change here applies to the next order placed &mdash; no
          redeploy. Clear a row to fall back to the listed price.</p>
        <div class="atools">
          <input type="search" id="pr-q" placeholder="Find a product&hellip;">
          <label class="fcheck"><input type="checkbox" id="pr-only"><span>Changed only</span></label>
          <span class="atools__n" id="pr-n"></span>
        </div>
        <div class="atable-wrap"><table class="atable" id="pr-table">
          <thead><tr><th>Product</th><th>Option</th><th class="r">Listed</th>
            <th class="r">Selling</th><th></th></tr></thead>
          <tbody></tbody>
        </table></div>
      </section>

      <section class="aview" data-view="orders" hidden>
        <h2 class="chrome">Orders</h2>
        <div class="atools">
          <select id="o-status">
            <option value="">All statuses</option>
            <option value="new">New</option><option value="packing">Packing</option>
            <option value="sent">Sent</option><option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span class="atools__n" id="o-n"></span>
        </div>
        <div id="orders">Loading&hellip;</div>
      </section>

      <section class="aview" data-view="settings" hidden>
        <h2 class="chrome">Settings</h2>
        <div class="apanel">
          <h3>Store</h3>
          <p class="ahint">Served by the API, so these change without a redeploy.</p>
          <form id="settings-form" class="aform">
            <label for="set-delivery">Delivery note</label>
            <textarea id="set-delivery" name="deliveryNote" rows="2" maxlength="400"></textarea>
            <label for="set-phone">Phone</label>
            <input id="set-phone" name="phone" maxlength="40">
            <label for="set-whatsapp">WhatsApp</label>
            <input id="set-whatsapp" name="whatsapp" maxlength="40">
            <button class="btn" type="submit">Save</button>
            <span class="status" id="set-status"></span>
          </form>
        </div>
      </section>
    </div>
  </div>
</div>`;
};
