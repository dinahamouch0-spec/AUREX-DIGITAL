import type { ProductInput } from "@/lib/product-schema";

/** Checked only when a product is being published (status = active).
 * Returns a list of specific, fixable problems — never a vague
 * "invalid configuration". */
export function validateProductForPublish(input: ProductInput): string[] {
  const issues: string[] = [];

  if (!input.ar.name.trim()) issues.push("Arabic name is required to publish.");
  if (!input.en.name.trim()) issues.push("English name is required to publish.");
  if (!input.categoryId) issues.push("A category is required to publish.");

  if (input.pricingMode === "fixed") {
    const hasOverrideField = input.fields.some(
      (f) => f.active && f.pricingRole === "price_override"
    );
    if (input.basePriceCents === null && !hasOverrideField) {
      issues.push(
        "Fixed pricing needs a base price, or a field whose selected option sets the price."
      );
    }
  } else {
    const hasUnitField = input.fields.some((f) => f.active && f.pricingRole === "price_unit");
    if (input.unitPriceCents === null && !hasUnitField) {
      issues.push(
        "Unit pricing needs a unit price, or a field whose selected option sets the per-unit price."
      );
    }
  }

  for (const field of input.fields) {
    if (!field.active) continue;

    if (!field.ar.label.trim() || !field.en.label.trim()) {
      issues.push(`Field "${field.key}" needs both an Arabic and English label.`);
    }

    const needsOptions = ["select", "radio", "checkbox"].includes(field.type);
    if (needsOptions && field.options.length === 0) {
      issues.push(`Field "${field.key}" is a ${field.type} field but has no options.`);
    }

    if (field.pricingRole === "price_override" || field.pricingRole === "price_unit") {
      for (const opt of field.options) {
        if (opt.priceOverrideCents === null) {
          issues.push(`Option "${opt.key}" on field "${field.key}" is missing its price.`);
        }
      }
    }

    if (field.pricingRole === "price_modifier") {
      for (const opt of field.options) {
        if (opt.priceModifierCents === null) {
          issues.push(`Option "${opt.key}" on field "${field.key}" is missing its price modifier.`);
        }
      }
    }
  }

  return issues;
}
