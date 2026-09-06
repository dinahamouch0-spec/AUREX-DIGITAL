// Minimal HTML helpers. Everything interpolated into a template passes through
// esc() unless it is markup this build authored. Part 3 §50.
export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Join template fragments, dropping null/false/undefined branches. */
export const j = (...parts) => parts.filter(Boolean).join('');

/** Map an array to markup. */
export const each = (arr, fn) => (arr || []).map(fn).join('');
