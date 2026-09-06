import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductCard } from "@/components/commerce/ProductCard";
import { CustomizerForm } from "@/components/commerce/CustomizerForm";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { LoadingState } from "@/components/shared/States";
import { getProductBySlug, getActiveProducts } from "@/lib/catalog";
import { estimateStartingPriceCents } from "@/lib/pricing";
import type { Locale } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale as Locale);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    alternates: {
      languages: { ar: `/ar/product/${slug}`, en: `/en/product/${slug}` },
      canonical: `/${locale}/product/${slug}`,
    },
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url }] } : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");

  const product = await getProductBySlug(slug, locale as Locale);
  if (!product || product.status === "archived" || product.status === "draft") {
    notFound();
  }

  const isUnavailable = product.status === "unavailable";
  const startingCents = estimateStartingPriceCents(product);

  const related = (
    await getActiveProducts(locale as Locale, { categorySlug: product.category.slug })
  ).filter((p) => p.slug !== product.slug);

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images.map((i) => `${base}${i.url}`),
    offers: {
      "@type": "Offer",
      price: (startingCents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: isUnavailable
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${base}/${locale}/product/${product.slug}`,
    },
  };

  return (
    <div className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} />

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-pink-deep">
                {product.category.name}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-brand-navy">{product.name}</h1>
              {product.shortDescription && (
                <p className="mt-2 text-brand-navy-soft">{product.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PriceDisplay
                cents={startingCents}
                prefix={t("startingFrom")}
                className="text-2xl font-extrabold text-brand-pink-deep"
              />
              <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-brand-navy-soft">
                {t("productionTime", { days: product.productionDays })}
              </span>
            </div>

            {product.description && (
              <p className="text-sm leading-relaxed text-brand-navy-soft">{product.description}</p>
            )}

            {isUnavailable ? (
              <div
                role="alert"
                className="rounded-2xl border border-brand-pink/30 bg-blush p-5 text-brand-pink-deep"
              >
                {t("notFound")}
              </div>
            ) : (
              <Suspense fallback={<LoadingState label="..." />}>
                <CustomizerForm product={product} />
              </Suspense>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-brand-navy">{t("relatedTitle")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

