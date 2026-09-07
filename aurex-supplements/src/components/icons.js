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
  phone:   svg('<path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/>'),
  /* WhatsApp's glyph is a filled mark, not a stroked one — drawn as such
     rather than approximated with the line set. */
  whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.2 1.26-1.97 1.42-.53.11-1.21.2-3.51-.75-2.95-1.22-4.85-4.21-5-4.4-.14-.2-1.19-1.58-1.19-3.02s.76-2.14 1.03-2.44c.27-.3.58-.37.78-.37h.56c.18 0 .42-.7.65.5.24.57.82 1.98.89 2.12.7.15.12.32.02.51-.9.2-.14.31-.28.48l-.42.49c-.14.14-.28.29-.12.57.16.27.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.28.14.44.12.6-.7.17-.2.69-.8.87-1.08.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.28.13.46.2.53.31.07.12.07.68-.17 1.35Z"/>
  </svg>`,
};
