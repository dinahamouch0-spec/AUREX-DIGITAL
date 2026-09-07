import { cart } from './cart.js';

/* Product page: the opening stage, variant pricing and add-to-cart. */
export function product() {
  const add = document.getElementById('add');
  if (!add) return;

  /* --- the stage opens ---------------------------------------------------- */
  const opener = document.getElementById('opener');
  const openBtn = document.getElementById('open-btn');
  if (opener && openBtn) {
    /* Open once on arrival so the first look shows what the page does, then
       hand the control to the visitor. */
    setTimeout(() => setOpen(true), 700);
    openBtn.addEventListener('click', () => setOpen(!opener.classList.contains('open')));
  }
  function setOpen(on) {
    opener.classList.toggle('open', on);
    openBtn.setAttribute('aria-pressed', String(on));
    openBtn.querySelector('span').textContent = on ? 'Close it' : 'Open it';
  }

  /* --- price follows the chosen option ------------------------------------ */
  const priceEl = document.getElementById('price');
  const variants = [...document.querySelectorAll('input[name="variant"]')];
  const chosen = () => variants.find((v) => v.checked) || variants[0];
  const paint = () => {
    const v = chosen();
    if (!v || !priceEl) return;
    const n = Number(v.dataset.price);
    priceEl.textContent = Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2);
  };
  variants.forEach((v) => v.addEventListener('change', paint));
  paint();

  /* --- quantity ----------------------------------------------------------- */
  const qty = document.getElementById('qty');
  const clamp = () => { qty.value = Math.min(99, Math.max(1, Number(qty.value) || 1)); };
  document.getElementById('q-up')?.addEventListener('click', () => { qty.value = Number(qty.value) + 1; clamp(); });
  document.getElementById('q-down')?.addEventListener('click', () => { qty.value = Number(qty.value) - 1; clamp(); });
  qty?.addEventListener('change', clamp);

  /* --- add ---------------------------------------------------------------- */
  add.addEventListener('click', () => {
    const v = chosen();
    if (!v) return;
    cart.add(v.value, add.dataset.product, Number(qty.value) || 1);
    const label = add.querySelector('span');
    const was = label.textContent;
    label.textContent = 'Added';
    add.classList.add('is-added');
    setTimeout(() => { label.textContent = was; add.classList.remove('is-added'); }, 1600);
  });
}
