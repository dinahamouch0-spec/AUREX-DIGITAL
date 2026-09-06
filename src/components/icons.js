// Inline SVG icons. Decorative ones carry aria-hidden; meaning always comes
// from adjacent text, never from the glyph alone. Part 1 §33.
const svg = (path, size = 20, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${path}</svg>`;

export const icons = {
  arrow:  (s = 18) => svg('<path d="M5 12h14M13 6l6 6-6 6"/>', s, ' class="arrow"'),
  star:   (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.6l2.5 6.1 6.6.5-5 4.3 1.5 6.4-5.6-3.4-5.6 3.4 1.5-6.4-5-4.3 6.6-.5z"/></svg>`,
  sparkle:(s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z"/></svg>`,
  check:  (s = 18) => svg('<path d="M20 6L9 17l-5-5"/>', s),
  shield: (s = 18) => svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>', s),
  camera: (s = 18) => svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', s),
  heart:  (s = 18) => svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>', s),
  book:   (s = 18) => svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>', s),
  gift:   (s = 18) => svg('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S9.5 2 7 4s5 4 5 4zM12 8s2.5-6 5-4-5 4-5 4z"/>', s),
  globe:  (s = 18) => svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>', s),
  menu:   (s = 22) => svg('<path d="M3 6h18M3 12h18M3 18h18"/>', s),
  close:  (s = 22) => svg('<path d="M18 6L6 18M6 6l12 12"/>', s),
  cart:   (s = 20) => svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>', s),
  plus:   (s = 14) => svg('<path d="M12 5v14M5 12h14"/>', s),
  clock:  (s = 18) => svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', s),
  info:   (s = 18) => svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', s),
  alert:  (s = 18) => svg('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>', s),
  box:    (s = 18) => svg('<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>', s),
  tag:    (s = 18) => svg('<path d="M20.6 13.4L12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7 7h.01"/>', s),
  wand:   (s = 18) => svg('<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M12.2 6.2l-1.4-1.4"/><path d="M3 21l9-9"/>', s),
  pencil: (s = 18) => svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s),
  list:   (s = 18) => svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', s),
  whatsapp: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.6.2l-.9 1c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5L9.4 7c-.2-.6-.5-.5-.7-.5h-.5a1 1 0 0 0-.8.4c-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2 3.1 5 4.3 1.8.8 2.5.9 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>`,
  instagram:(s = 20) => svg('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>', s),
};
