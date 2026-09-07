/* The AUREX chevron, redrawn as inline SVG so it can be animated, recoloured
   and stroked. The supplied logo is a raster lockup — fine on a banner, no
   use for a mark that has to draw itself during the boot sequence. */
export const chevron = ({ id = 'm', cls = '', title = '' } = {}) => `
<svg class="${cls}" viewBox="0 0 100 92" role="${title ? 'img' : 'presentation'}"
     ${title ? `aria-label="${title}"` : 'aria-hidden="true"'} focusable="false">
  <defs>
    <linearGradient id="${id}-steel" x1="0" y1="0" x2=".35" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset=".28" stop-color="#DCE1E6"/>
      <stop offset=".52" stop-color="#8C97A3"/><stop offset=".74" stop-color="#EDF1F4"/>
      <stop offset="1" stop-color="#6E7A87"/>
    </linearGradient>
    <linearGradient id="${id}-arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#CEF4FF"/><stop offset=".5" stop-color="#35A7DF"/>
      <stop offset="1" stop-color="#1A4773"/>
    </linearGradient>
  </defs>
  <path class="st fill" fill="url(#${id}-steel)" stroke="url(#${id}-steel)" stroke-width=".6"
        d="M50 2 96 90H70L50 44 30 90H4Z"/>
  <path class="st fill" fill="url(#${id}-steel)" stroke="url(#${id}-steel)" stroke-width=".6"
        d="M50 52 68 90H50L41 70Z"/>
  <path class="arc" fill="url(#${id}-arc)" d="M49 50 34 90H20L44 44Z"/>
</svg>`;

/* The barbell rule under the wordmark, from the supplied lockup. */
export const barbell = (cls = '') => `
<svg class="${cls}" viewBox="0 0 64 20" aria-hidden="true" focusable="false">
  <g fill="currentColor">
    <rect x="6" y="6" width="2.4" height="8" rx="1"/>
    <rect x="11" y="2" width="2.4" height="16" rx="1"/>
    <rect x="16" y="5" width="2.4" height="10" rx="1"/>
    <rect x="22" y="9" width="20" height="2" rx="1"/>
    <rect x="45.6" y="5" width="2.4" height="10" rx="1"/>
    <rect x="50.6" y="2" width="2.4" height="16" rx="1"/>
    <rect x="55.6" y="6" width="2.4" height="8" rx="1"/>
  </g>
</svg>`;
