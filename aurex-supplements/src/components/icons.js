/* Stroked line icons at a single weight, so nothing in the interface looks
   borrowed from a different set. */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
  aria-hidden="true" focusable="false">${d}${extra}</svg>`;

export const icons = {
  cart:    svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>'),
  search:  svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'),
  menu:    svg('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  close:   svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: svg('<path d="m9 5 7 7-7 7"/>'),
  minus:   svg('<path d="M5 12h14"/>'),
  plus:    svg('<path d="M12 5v14M5 12h14"/>'),
  check:   svg('<path d="m4 12 5.5 5.5L20 7"/>'),
  shield:  svg('<path d="M12 3 4.5 6v6c0 4.4 3.1 7.8 7.5 9 4.4-1.2 7.5-4.6 7.5-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  truck:   svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>'),
  bolt:    svg('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
  globe:   svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>'),
  filter:  svg('<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>'),
  arrow:   svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  drag:    svg('<path d="M9 6 5 12l4 6M15 6l4 6-4 6"/>'),
};
