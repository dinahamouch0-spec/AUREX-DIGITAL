import { z } from "zod";

const optionSchema = z.object({
  id: z.string().optional(), // absent = new
  key: z.string().min(1),
  sortOrder: z.number().int(),
  priceOverrideCents: z.number().int().nullable(),
  priceModifierCents: z.number().int().nullable(),
  ar: z.string().min(1),
  en: z.string().min(1),
});

const fieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  type: z.enum(["short_text", "long_text", "number", "select", "radio", "checkbox", "image_upload"]),
  required: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  pricingRole: z.enum(["none", "quantity", "price_override", "price_unit", "price_modifier"]),
  defaultValue: z.string().nullable().optional(),
  ar: z.object({ label: z.string().min(1), helpText: z.string().nullable().optional(), placeholder: z.string().nullable().optional() }),
  en: z.object({ label: z.string().min(1), helpText: z.string().nullable().optional(), placeholder: z.string().nullable().optional() }),
  options: z.array(optionSchema).default([]),
});

export const productSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  categoryId: z.string().min(1),
  status: z.enum(["draft", "active", "archived", "unavailable"]),
  featured: z.boolean(),
  pricingMode: z.enum(["fixed", "unit"]),
  basePriceCents: z.number().int().nullable(),
  unitPriceCents: z.number().int().nullable(),
  productionDays: z.string().min(1),
  images: z.array(z.object({ url: z.string().min(1), alt: z.string().optional() })),
  ar: z.object({
    name: z.string().min(1),
    shortDescription: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
  en: z.object({
    name: z.string().min(1),
    shortDescription: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
  fields: z.array(fieldSchema).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
