import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { EmptyState } from "@/components/shared/States";
import { getActiveProducts } from "@/lib/catalog";
import type { Locale } from "@prisma/client";

export async function FeaturedProducts() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("featured");
  const products = await getActiveProducts(locale, { featuredOnly: true });

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState title={t("empty")} />
        )}
      </Container>
    </section>
  );
}
