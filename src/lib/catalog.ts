import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

function pickTranslation<T extends { locale: Locale }>(
  translations: T[],
  locale: Locale
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale !== locale)
  );
}

export async function getActiveCategories(locale: Locale) {
  const categories = await prisma.category.findMany({
    where: { status: "active" },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  return categories.map((c) => {
    const tr = pickTranslation(c.translations, locale);
    return {
      id: c.id,
      slug: c.slug,
      imageUrl: c.imageUrl,
      name: tr?.name ?? c.slug,
      description: tr?.description ?? null,
    };
  });
}

export async function getCategoryBySlug(slug: string, locale: Locale) {
  const category = await prisma.category.findFirst({
    where: { slug, status: "active" },
    include: { translations: true },
  });
  if (!category) return null;
  const tr = pickTranslation(category.translations, locale);
  return {
    id: category.id,
    slug: category.slug,
    imageUrl: category.imageUrl,
    name: tr?.name ?? category.slug,
    description: tr?.description ?? null,
  };
}

const productInclude = {
  translations: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  category: { include: { translations: true } },
  customizationFields: {
    where: { active: true },
    orderBy: { sortOrder: "asc" as const },
    include: {
      translations: true,
      options: {
        where: { active: true },
        orderBy: { sortOrder: "asc" as const },
        include: { translations: true },
      },
    },
  },
};

export type ProductWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.product.findFirst<{ include: typeof productInclude }>>>
>;

export function localizeProduct(product: ProductWithRelations, locale: Locale) {
  const tr = pickTranslation(product.translations, locale);
  const categoryTr = pickTranslation(product.category.translations, locale);

  return {
    id: product.id,
    slug: product.slug,
    status: product.status,
    featured: product.featured,
    pricingMode: product.pricingMode,
    basePriceCents: product.basePriceCents,
    unitPriceCents: product.unitPriceCents,
    currency: product.currency,
    productionDays: product.productionDays,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? tr?.name ?? "" })),
    name: tr?.name ?? product.slug,
    shortDescription: tr?.shortDescription ?? null,
    description: tr?.description ?? null,
    category: {
      slug: product.category.slug,
      name: categoryTr?.name ?? product.category.slug,
    },
    customizationFields: product.customizationFields.map((f) => {
      const fieldTr = pickTranslation(f.translations, locale);
      return {
        id: f.id,
        key: f.key,
        type: f.type,
        required: f.required,
        sortOrder: f.sortOrder,
        pricingRole: f.pricingRole,
        defaultValue: f.defaultValue,
        label: fieldTr?.label ?? f.key,
        helpText: fieldTr?.helpText ?? null,
        placeholder: fieldTr?.placeholder ?? null,
        options: f.options.map((o) => {
          const optTr = pickTranslation(o.translations, locale);
          return {
            id: o.id,
            key: o.key,
            sortOrder: o.sortOrder,
            priceOverrideCents: o.priceOverrideCents,
            priceModifierCents: o.priceModifierCents,
            label: optTr?.label ?? o.key,
          };
        }),
      };
    }),
  };
}

export async function getProductBySlug(slug: string, locale: Locale) {
  const product = await prisma.product.findFirst({
    where: { slug },
    include: productInclude,
  });
  if (!product) return null;
  return localizeProduct(product, locale);
}

/** Same as getProductBySlug but by id — used server-side (checkout /
 * order creation) where we already hold the product id from the cart. */
export async function getProductByIdLocalized(id: string, locale: Locale) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product) return null;
  return localizeProduct(product, locale);
}

export async function getActiveProducts(
  locale: Locale,
  opts: { categorySlug?: string; featuredOnly?: boolean } = {}
) {
  const products = await prisma.product.findMany({
    where: {
      status: "active",
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
      ...(opts.featuredOnly ? { featured: true } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: productInclude,
  });
  return products.map((p) => localizeProduct(p, locale));
}

export type LocalizedProduct = Awaited<ReturnType<typeof getProductBySlug>>;

const pricingInclude = {
  customizationFields: {
    where: { active: true },
    include: { options: { where: { active: true } } },
  },
};

/** Raw (non-localized) product shape for pricing/validation — structurally
 * compatible with ProductForPricing without any mapping. */
export async function getProductForPricing(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: pricingInclude,
  });
}

export async function getLocalizedProductName(
  productId: string,
  locale: Locale
): Promise<{ name: string; slug: string; imageUrl: string | null } | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { translations: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (!product) return null;
  const tr = pickTranslation(product.translations, locale);
  return {
    name: tr?.name ?? product.slug,
    slug: product.slug,
    imageUrl: product.images[0]?.url ?? null,
  };
}
