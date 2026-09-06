import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { orderBy: { sortOrder: "asc" } },
        customizationFields: {
          orderBy: { sortOrder: "asc" },
          include: {
            translations: true,
            options: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { status: "active" },
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    }),
  ]);

  if (!product) notFound();

  const ar = product.translations.find((t) => t.locale === "ar");
  const en = product.translations.find((t) => t.locale === "en");

  const initialData = {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    status: product.status,
    featured: product.featured,
    pricingMode: product.pricingMode,
    basePriceCents: product.basePriceCents,
    unitPriceCents: product.unitPriceCents,
    productionDays: product.productionDays,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    ar: { name: ar?.name ?? "", shortDescription: ar?.shortDescription ?? "", description: ar?.description ?? "" },
    en: { name: en?.name ?? "", shortDescription: en?.shortDescription ?? "", description: en?.description ?? "" },
    fields: product.customizationFields.map((f) => {
      const fAr = f.translations.find((t) => t.locale === "ar");
      const fEn = f.translations.find((t) => t.locale === "en");
      return {
        id: f.id,
        key: f.key,
        type: f.type,
        required: f.required,
        active: f.active,
        sortOrder: f.sortOrder,
        pricingRole: f.pricingRole,
        defaultValue: f.defaultValue,
        ar: { label: fAr?.label ?? "", helpText: fAr?.helpText ?? "", placeholder: fAr?.placeholder ?? "" },
        en: { label: fEn?.label ?? "", helpText: fEn?.helpText ?? "", placeholder: fEn?.placeholder ?? "" },
        options: f.options.map((o) => {
          const oAr = o.translations.find((t) => t.locale === "ar");
          const oEn = o.translations.find((t) => t.locale === "en");
          return {
            id: o.id,
            key: o.key,
            sortOrder: o.sortOrder,
            priceOverrideCents: o.priceOverrideCents,
            priceModifierCents: o.priceModifierCents,
            ar: oAr?.label ?? "",
            en: oEn?.label ?? "",
          };
        }),
      };
    }),
  };

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    label: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
  }));

  return <ProductEditor initialData={initialData} categoryOptions={categoryOptions} />;
}
