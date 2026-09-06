import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { Link } from "@/i18n/navigation";
import { getActiveCategories, getActiveProducts } from "@/lib/catalog";
import type { Locale } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { languages: { ar: "/ar/shop", en: "/en/shop" }, canonical: `/${locale}/shop` },
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shop");

  const [categories, products] = await Promise.all([
    getActiveCategories(locale as Locale),
    getActiveProducts(locale as Locale),
  ]);

  return (
    <div className="py-10 sm:py-14">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center sm:text-start">
          <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
          <p className="text-brand-navy-soft">{t("subtitle")}</p>
        </div>

        <nav aria-label="Categories" className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Link
            href="/shop"
            className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white"
          >
            {t("allCategories")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm hover:bg-blush hover:text-brand-pink-deep"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <ProductGrid products={products} />
      </Container>
    </div>
  );
}
