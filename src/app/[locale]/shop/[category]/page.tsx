import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { Link } from "@/i18n/navigation";
import { getActiveCategories, getCategoryBySlug, getActiveProducts } from "@/lib/catalog";
import type { Locale } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = await getCategoryBySlug(category, locale as Locale);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.description ?? undefined,
    alternates: {
      languages: { ar: `/ar/shop/${category}`, en: `/en/shop/${category}` },
      canonical: `/${locale}/shop/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: categorySlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shop");

  const category = await getCategoryBySlug(categorySlug, locale as Locale);
  if (!category) notFound();

  const [categories, products] = await Promise.all([
    getActiveCategories(locale as Locale),
    getActiveProducts(locale as Locale, { categorySlug }),
  ]);

  return (
    <div className="py-10 sm:py-14">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center sm:text-start">
          <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{category.name}</h1>
          {category.description && (
            <p className="text-brand-navy-soft">{category.description}</p>
          )}
        </div>

        <nav aria-label="Categories" className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Link
            href="/shop"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm hover:bg-blush hover:text-brand-pink-deep"
          >
            {t("allCategories")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className={
                c.slug === categorySlug
                  ? "rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm hover:bg-blush hover:text-brand-pink-deep"
              }
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
