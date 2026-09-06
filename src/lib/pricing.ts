/**
 * Generic, configuration-driven pricing engine.
 *
 * This file must never branch on "is this a story / sticker / notebook".
 * Every product's price is derived purely from its `pricingMode` +
 * `basePriceCents` / `unitPriceCents`, combined with whichever of its
 * fields carry a `pricingRole` and the options the customer selected.
 *
 * Types here are intentionally minimal/structural (not imported from
 * @prisma/client) so both raw DB query results and locale-projected
 * display objects satisfy them without extra mapping.
 */

export interface PricingOptionLike {
  key: string;
  active?: boolean;
  priceOverrideCents: number | null;
  priceModifierCents: number | null;
}

export interface PricingFieldLike {
  key: string;
  type: string;
  active?: boolean;
  required?: boolean;
  pricingRole: string;
  options: PricingOptionLike[];
}

export interface ProductForPricing {
  basePriceCents: number | null;
  unitPriceCents: number | null;
  customizationFields: PricingFieldLike[];
}

/** Raw answers keyed by field.key. Selects/radios: option key string.
 *  Checkboxes: array of option keys. Numbers/text: string. */
export type AnswerMap = Record<string, string | string[] | undefined>;

export interface PriceBreakdownLine {
  fieldKey: string;
  role: string;
  amountCents: number;
}

export interface PriceResult {
  quantity: number;
  unitPriceCents: number | null;
  basePriceCents: number | null;
  modifierCents: number;
  lineTotalCents: number;
  breakdown: PriceBreakdownLine[];
}

export class PricingValidationError extends Error {
  constructor(public fieldKey: string, message: string) {
    super(message);
  }
}

function toNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function selectedOptionKeys(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

export function calculatePrice(
  product: ProductForPricing,
  answers: AnswerMap
): PriceResult {
  let quantity = 1;
  let basePriceCents = product.basePriceCents ?? null;
  let unitPriceCents = product.unitPriceCents ?? null;
  let modifierCents = 0;
  const breakdown: PriceBreakdownLine[] = [];

  const activeFields = product.customizationFields.filter((f) => f.active !== false);

  // Pass 1: quantity fields
  for (const field of activeFields) {
    if (field.pricingRole !== "quantity") continue;
    const n = toNumber(answers[field.key]);
    if (n !== null && n > 0) {
      quantity = Math.floor(n);
    }
  }

  // Pass 2: price-affecting option fields
  for (const field of activeFields) {
    if (field.pricingRole === "none" || field.pricingRole === "quantity") continue;

    const keys = selectedOptionKeys(answers[field.key]);
    if (keys.length === 0) continue;

    for (const key of keys) {
      const option = field.options.find((o) => o.key === key && o.active !== false);
      if (!option) continue;

      if (field.pricingRole === "price_override") {
        if (option.priceOverrideCents !== null) {
          basePriceCents = option.priceOverrideCents;
          breakdown.push({
            fieldKey: field.key,
            role: "price_override",
            amountCents: option.priceOverrideCents,
          });
        }
      } else if (field.pricingRole === "price_unit") {
        if (option.priceOverrideCents !== null) {
          unitPriceCents = option.priceOverrideCents;
          breakdown.push({
            fieldKey: field.key,
            role: "price_unit",
            amountCents: option.priceOverrideCents,
          });
        }
      } else if (field.pricingRole === "price_modifier") {
        if (option.priceModifierCents !== null) {
          modifierCents += option.priceModifierCents;
          breakdown.push({
            fieldKey: field.key,
            role: "price_modifier",
            amountCents: option.priceModifierCents,
          });
        }
      }
    }
  }

  let lineTotalCents: number;
  if (unitPriceCents !== null) {
    lineTotalCents = unitPriceCents * quantity + modifierCents;
  } else {
    lineTotalCents = (basePriceCents ?? 0) + modifierCents;
  }

  return {
    quantity,
    unitPriceCents,
    basePriceCents,
    modifierCents,
    lineTotalCents,
    breakdown,
  };
}

/** Validates that every required, active field has an answer, and that
 * every selected option actually exists and is active. Throws
 * PricingValidationError on the first problem found. */
export function validateAnswers(
  product: ProductForPricing,
  answers: AnswerMap
): void {
  const activeFields = product.customizationFields.filter((f) => f.active !== false);

  for (const field of activeFields) {
    const raw = answers[field.key];

    if (field.type === "checkbox") {
      const keys = selectedOptionKeys(raw);
      if (field.required && keys.length === 0) {
        throw new PricingValidationError(field.key, "required");
      }
      for (const key of keys) {
        if (!field.options.find((o) => o.key === key && o.active !== false)) {
          throw new PricingValidationError(field.key, "invalid_option");
        }
      }
      continue;
    }

    if (field.type === "select" || field.type === "radio") {
      const key = typeof raw === "string" ? raw : undefined;
      if (field.required && !key) {
        throw new PricingValidationError(field.key, "required");
      }
      if (key && !field.options.find((o) => o.key === key && o.active !== false)) {
        throw new PricingValidationError(field.key, "invalid_option");
      }
      continue;
    }

    if (field.type === "number") {
      const n = toNumber(raw);
      if (field.required && n === null) {
        throw new PricingValidationError(field.key, "required");
      }
      if (n !== null && n <= 0) {
        throw new PricingValidationError(field.key, "invalid_quantity");
      }
      continue;
    }

    if (field.type === "image_upload") {
      if (field.required && (typeof raw !== "string" || raw.length === 0)) {
        throw new PricingValidationError(field.key, "required");
      }
      continue;
    }

    // short_text / long_text
    if (field.required && (typeof raw !== "string" || raw.trim().length === 0)) {
      throw new PricingValidationError(field.key, "required");
    }
  }
}

/** "Starting from" price for catalog/product cards — the cheapest the
 * product could possibly be, before the customer answers anything. */
export function estimateStartingPriceCents(product: ProductForPricing): number {
  let base = product.basePriceCents ?? 0;
  let unit = product.unitPriceCents ?? null;

  for (const field of product.customizationFields) {
    if (field.active === false || field.options.length === 0) continue;

    if (field.pricingRole === "price_override") {
      const cheapest = field.options
        .map((o) => o.priceOverrideCents)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)[0];
      if (cheapest !== undefined) base = cheapest;
    }

    if (field.pricingRole === "price_unit") {
      const cheapest = field.options
        .map((o) => o.priceOverrideCents)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)[0];
      if (cheapest !== undefined) unit = cheapest;
    }
  }

  return unit !== null ? unit : base;
}

export function formatCentsUSD(cents: number, locale: "ar" | "en"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
