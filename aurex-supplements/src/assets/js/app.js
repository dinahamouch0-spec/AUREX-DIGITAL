import { boot } from './boot.js';
import { ring } from './ring.js';
import { initCart } from './cart.js';
import { reveal } from './reveal.js';
import { shop } from './shop.js';
import { product } from './product.js';
import { cartPage, checkout } from './cartpage.js';
import { admin } from './admin.js';
import { search } from './search.js';

/* Header shadow, mobile nav, and the search overlay are page furniture; they
   work before the boot sequence finishes so a fast connection is not punished
   with a dead interface behind the loader. */
function shell() {
  const hdr = document.getElementById('hdr');
  if (hdr) {
    const onScroll = () => hdr.classList.toggle('stuck', scrollY > 12);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    const open = nav.hasAttribute('data-open');
    nav.toggleAttribute('data-open', !open);
    burger.setAttribute('aria-expanded', String(!open));
  });
}

initCart();
shell();
reveal();
shop();
product();
cartPage();
checkout();
admin();
search();

boot().then(() => { ring(); });
