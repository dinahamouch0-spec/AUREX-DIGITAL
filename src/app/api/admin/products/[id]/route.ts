import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { productSchema } from "@/lib/product-schema";
import { validateProductForPublish } from "@/lib/product-guardrails";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({
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
  });

  if (!product) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const ar = product.translations.find((t) => t.locale === "ar");
  const en = product.translations.find((t) => t.locale === "en");

  return NextResponse.json({
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
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (input.status === "active") {
    const issues = validateProductForPublish(input);
    if (issues.length > 0) {
      return NextResponse.json({ error: "PUBLISH_BLOCKED", issues }, { status: 422 });
    }
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const slugTaken = await prisma.product.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (slugTaken) {
    return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        slug: input.slug,
        categoryId: input.categoryId,
        status: input.status,
        featured: input.featured,
        pricingMode: input.pricingMode,
        basePriceCents: input.basePriceCents,
        unitPriceCents: input.unitPriceCents,
        productionDays: input.productionDays,
      },
    });

    await tx.productTranslation.upsert({
      where: { productId_locale: { productId: id, locale: "ar" } },
      create: { productId: id, locale: "ar", ...input.ar },
      update: { ...input.ar },
    });
    await tx.productTranslation.upsert({
      where: { productId_locale: { productId: id, locale: "en" } },
      create: { productId: id, locale: "en", ...input.en },
      update: { ...input.en },
    });

    await tx.productImage.deleteMany({ where: { productId: id } });
    if (input.images.length > 0) {
      await tx.productImage.createMany({
        data: input.images.map((img, i) => ({
          productId: id,
          url: img.url,
          alt: img.alt || null,
          sortOrder: i,
        })),
      });
    }

    const existingFields = await tx.customizationField.findMany({ where: { productId: id } });
    const incomingFieldIds = new Set(input.fields.map((f) => f.id).filter(Boolean));
    const fieldsToDelete = existingFields.filter((f) => !incomingFieldIds.has(f.id));
    if (fieldsToDelete.length > 0) {
      await tx.customizationField.deleteMany({ where: { id: { in: fieldsToDelete.map((f) => f.id) } } });
    }

    for (const field of input.fields) {
      const fieldRecord = field.id
        ? await tx.customizationField.update({
            where: { id: field.id },
            data: {
              key: field.key,
              type: field.type,
              required: field.required,
              active: field.active,
              sortOrder: field.sortOrder,
              pricingRole: field.pricingRole,
              defaultValue: field.defaultValue || null,
            },
          })
        : await tx.customizationField.create({
            data: {
              productId: id,
              key: field.key,
              type: field.type,
              required: field.required,
              active: field.active,
              sortOrder: field.sortOrder,
              pricingRole: field.pricingRole,
              defaultValue: field.defaultValue || null,
            },
          });

      await tx.customizationFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: fieldRecord.id, locale: "ar" } },
        create: { fieldId: fieldRecord.id, locale: "ar", ...field.ar },
        update: { ...field.ar },
      });
      await tx.customizationFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: fieldRecord.id, locale: "en" } },
        create: { fieldId: fieldRecord.id, locale: "en", ...field.en },
        update: { ...field.en },
      });

      const existingOptions = await tx.customizationOption.findMany({
        where: { fieldId: fieldRecord.id },
      });
      const incomingOptionIds = new Set(field.options.map((o) => o.id).filter(Boolean));
      const optionsToDelete = existingOptions.filter((o) => !incomingOptionIds.has(o.id));
      if (optionsToDelete.length > 0) {
        await tx.customizationOption.deleteMany({
          where: { id: { in: optionsToDelete.map((o) => o.id) } },
        });
      }

      for (const opt of field.options) {
        const optRecord = opt.id
          ? await tx.customizationOption.update({
              where: { id: opt.id },
              data: {
                key: opt.key,
                sortOrder: opt.sortOrder,
                priceOverrideCents: opt.priceOverrideCents,
                priceModifierCents: opt.priceModifierCents,
              },
            })
          : await tx.customizationOption.create({
              data: {
                fieldId: fieldRecord.id,
                key: opt.key,
                sortOrder: opt.sortOrder,
                priceOverrideCents: opt.priceOverrideCents,
                priceModifierCents: opt.priceModifierCents,
              },
            });

        await tx.customizationOptionTranslation.upsert({
          where: { optionId_locale: { optionId: optRecord.id, locale: "ar" } },
          create: { optionId: optRecord.id, locale: "ar", label: opt.ar },
          update: { label: opt.ar },
        });
        await tx.customizationOptionTranslation.upsert({
          where: { optionId_locale: { optionId: optRecord.id, locale: "en" } },
          create: { optionId: optRecord.id, locale: "en", label: opt.en },
          update: { label: opt.en },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

/** "Delete" from the admin UI archives rather than destroys — products
 * referenced by historical orders must never disappear. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { status: "archived" } });
  return NextResponse.json({ ok: true });
}
