import { cart } from './cart.js';

/* The cart page re-prices every line against a build-time index rather than
   trusting what was stored, so a price change is picked up the next time the
   page loads instead of living on in someone's tab. */
export async function cartPage() {
  const host = document.getElementById('cartlines');
  if (!host) return;

  let index;
  try {
    index = await (await fetch('/assets/cart-index.json')).json();
  } catch {
    host.innerHTML = '<p class="ahint">Could not load prices. Refresh to try again.</p>';
    return;
  }

  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const render = () => {
    const lines = cart.lines().map((l) => ({ ...l, v: index[l.variantId] })).filter((l) => l.v);
    document.getElementById('cartempty').hidden = lines.length > 0;
    document.getElementById('cartwrap').hidden = lines.length === 0;
    if (!lines.length) { host.innerHTML = ''; return; }

    host.innerHTML = lines.map((l) => `
      <div class="cline${l.v.stage ? ' cline--stage' : ''}">
        <img src="${l.v.img}" alt="" width="76" height="76" loading="lazy">
        <div>
          <p class="cline__b">${l.v.brand}</p>
          <p class="cline__n">${l.v.name}</p>
          ${l.v.label ? `<p class="cline__v">${l.v.label}</p>` : ''}
          <div class="qty" style="margin-top:8px">
            <button type="button" data-act="dec" data-v="${l.variantId}" aria-label="One fewer">−</button>
            <input type="number" value="${l.qty}" min="1" max="99" data-v="${l.variantId}" aria-label="Quantity">
            <button type="button" data-act="inc" data-v="${l.variantId}" aria-label="One more">+</button>
          </div>
        </div>
        <div class="cline__r">
          <span class="cline__p">${money(l.v.price * l.qty)}</span>
          <button class="cline__x" type="button" data-act="rm" data-v="${l.variantId}">Remove</button>
        </div>
      </div>`).join('');

    const sub = lines.reduce((s, l) => s + l.v.price * l.qty, 0);
    const items = lines.reduce((s, l) => s + l.qty, 0);
    document.getElementById('carttotal').innerHTML = `
      <div class="ctrow"><span>${items} item${items === 1 ? '' : 's'}</span><b>${money(sub)}</b></div>
      <div class="ctrow"><span>Delivery</span><b>Calculated at checkout</b></div>
      <div class="ctrow ctrow--total"><span>Total</span><b>${money(sub)}</b></div>
      <button class="btn" id="checkout" style="width:100%">Checkout</button>
      <p class="ahint">Prices in USD. Stock is confirmed when the order is placed.</p>`;
  };

  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.v;
    const now = cart.lines().find((l) => l.variantId === id)?.qty || 1;
    if (b.dataset.act === 'rm') cart.remove(id);
    if (b.dataset.act === 'inc') cart.setQty(id, Math.min(99, now + 1));
    if (b.dataset.act === 'dec') cart.setQty(id, now - 1);
  });
  host.addEventListener('change', (e) => {
    if (e.target.matches('input[data-v]'))
      cart.setQty(e.target.dataset.v, Math.min(99, Math.max(0, Number(e.target.value) || 0)));
  });
  addEventListener('cart:change', render);
  render();
}

/* Checkout. The form collects contact details; the server prices the order
   and returns a reference. Nothing about money is decided in this file. */
export function checkout() {
  const dlg = document.getElementById('checkout-dlg');
  if (!dlg) return;
  const form = document.getElementById('checkout-form');
  const err = document.getElementById('co-err');

  document.addEventListener('click', (e) => {
    if (e.target.id === 'checkout') dlg.showModal();
    if (e.target.id === 'co-close') dlg.close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const send = document.getElementById('co-send');
    err.hidden = true;
    send.disabled = true;
    send.textContent = 'Placing…';

    const { cart } = await import('./cart.js');
    const fd = new FormData(form);
    try {
      const r = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: Object.fromEntries(fd.entries()),
          lines: cart.lines().map((l) => ({ variantId: l.variantId, qty: l.qty })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data.errors || ['That did not go through.'])[0]);

      cart.clear();
      dlg.close();
      document.getElementById('cartwrap').hidden = true;
      document.getElementById('cartempty').hidden = true;
      document.getElementById('placed-num').textContent = data.number;
      document.getElementById('placed').hidden = false;
    } catch (e2) {
      err.textContent = e2.message;
      err.hidden = false;
    } finally {
      send.disabled = false;
      send.textContent = 'Place order';
    }
  });
}
