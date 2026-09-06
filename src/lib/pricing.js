// Generic pricing engine. Part 2 §5: supports fixed, unit, override and
// modifier pricing. It reads product configuration only — adding a product or
// changing a price never touches this file.
//
// Shared verbatim by the build (for "from" prices) and by the browser
// customizer. Part 2 §6 keeps the server authoritative: this is display maths,
// and the same module runs server-side at order time so both agree.

/** Selected option records for every option-bearing field that has an answer. */
export function selectedOptions(product, answers = {}) {
  const out = [];
  for (const field of product.fields || []) {
    if (!field.active || !field.options) continue;
    const raw = answers[field.key];
    if (raw == null || raw === '') continue;
    for (const key of Array.isArray(raw) ? raw : [raw]) {
      const opt = field.options.find((o) => o.key === key && o.active);
      if (opt) out.push({ field, option: opt });
    }
  }
  return out;
}

/**
 * Resolve the price of a single unit.
 * Precedence: an option price override replaces the base; modifiers then add.
 */
export function unitPrice(product, answers = {}) {
  const pricing = product.pricing || {};
  let base = pricing.basePrice ?? null;
  let modifiers = 0;
  let overridden = false;

  for (const { option } of selectedOptions(product, answers)) {
    if (option.priceOverride != null) { base = option.priceOverride; overridden = true; }
    if (option.priceModifier != null) modifiers += option.priceModifier;
  }

  // An override-priced product has no price until its driver option is chosen.
  if (pricing.type === 'option_override' && !overridden) return null;
  if (base == null) return null;
  return round2(base + modifiers);
}

/** Line total for a quantity. Returns null while the price is not yet knowable. */
export function lineTotal(product, answers = {}, quantity = 1) {
  const unit = unitPrice(product, answers);
  if (unit == null) return null;
  return round2(unit * clampQuantity(product, quantity));
}

/** Lowest price this product can be bought at — the storefront "from" price. */
export function startingPrice(product) {
  const pricing = product.pricing || {};
  if (pricing.type !== 'option_override') {
    return pricing.basePrice != null ? round2(pricing.basePrice) : null;
  }
  const driver = (product.fields || []).find((f) => f.key === pricing.driverField);
  const prices = (driver?.options || [])
    .filter((o) => o.active && o.priceOverride != null)
    .map((o) => o.priceOverride);
  return prices.length ? round2(Math.min(...prices)) : null;
}

export function clampQuantity(product, quantity) {
  const q = product.quantity || { min: 1, max: 99, step: 1 };
  const step = q.step || 1;
  let n = Math.round(Number(quantity) || q.min);
  n = Math.round(n / step) * step;          // snap to the supported increment
  return Math.min(q.max, Math.max(q.min, n));
}

/** True when every required active field has an answer. */
export function missingRequired(product, answers = {}) {
  return (product.fields || [])
    .filter((f) => f.active && f.required)
    .filter((f) => {
      const v = answers[f.key];
      return v == null || v === '' || (Array.isArray(v) && v.length === 0);
    })
    .map((f) => f.key);
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
