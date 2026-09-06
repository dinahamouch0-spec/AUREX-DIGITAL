// Input validation and sanitisation. Part 2 §49 / Part 3 §47, §50.
// Never trust anything from the client: shape, type, length and membership are
// all re-checked here regardless of what the browser already validated.

export const MAX = { name: 120, phone: 32, email: 160, city: 120, address: 500, notes: 1200, text: 400 };

// Control characters, written as escapes so the source stays plain ASCII.
const CTRL = /[\x00-\x1f\x7f]/g;
const CTRL_KEEP_NL = /[\x00-\x09\x0b-\x1f\x7f]/g;

/** Collapse whitespace, strip control characters, and cap length. */
export function clean(v, max = MAX.text) {
  if (v == null) return '';
  return String(v).replace(CTRL, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Multi-line variant that keeps newlines but still caps and strips controls. */
export function cleanMultiline(v, max = MAX.notes) {
  if (v == null) return '';
  return String(v)
    .replace(/\r\n/g, '\n')
    .replace(CTRL_KEEP_NL, '')
    .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ''));

/** Accepts common local and international forms; stores digits with any +. */
export function normalisePhone(v) {
  const raw = String(v || '').trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 6 || digits.length > 18) return null;
  return raw.startsWith('+') ? `+${digits}` : digits;
}

/** Field-level errors keyed by field name, for rendering next to each input. */
export function validateCustomer(input) {
  const errors = {};
  const out = {
    name: clean(input.name, MAX.name),
    phone: normalisePhone(input.phone),
    email: clean(input.email, MAX.email),
    country: clean(input.country, MAX.city),
    city: clean(input.city, MAX.city),
    address: cleanMultiline(input.address, MAX.address),
    addressNotes: cleanMultiline(input.addressNotes, MAX.notes),
    paymentMethod: clean(input.paymentMethod, 32),
  };

  if (out.name.length < 2) errors.name = 'required';
  if (!out.phone) errors.phone = 'invalid';
  if (out.email && !isEmail(out.email)) errors.email = 'invalid';
  if (out.country.length < 2) errors.country = 'required';
  if (out.city.length < 2) errors.city = 'required';
  if (out.address.length < 5) errors.address = 'required';
  if (!['cod', 'whish'].includes(out.paymentMethod)) errors.paymentMethod = 'required';

  return { value: out, errors, ok: Object.keys(errors).length === 0 };
}

/* ------------------------------------------------------- image sniffing -- */
// Part 2 §14 / Part 3 §32: content is identified by magic bytes, never by the
// filename extension or the client-declared MIME type. An SVG or a PHP script
// renamed to .jpg does not get through.
const SIGS = [
  { mime: 'image/jpeg', ext: 'jpg',  test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png',  ext: 'png',  test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'image/heic', ext: 'heic', test: (b) => {
      const brand = b.slice(4, 12).toString('latin1');
      return brand.startsWith('ftyp') && /heic|heix|hevc|mif1|heim|msf1/.test(brand);
    } },
];

/** Returns { mime, ext } for a recognised raster image, or null. */
export function sniffImage(buf) {
  if (!buf || buf.length < 16) return null;
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  for (const s of SIGS) {
    try { if (s.test(b)) return { mime: s.mime, ext: s.ext }; } catch { /* try next signature */ }
  }
  return null;
}

/** Random, unguessable storage key - never derived from the uploaded filename. */
export function randomKey(bytes = 24) {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (n) => n.toString(16).padStart(2, '0')).join('');
}
