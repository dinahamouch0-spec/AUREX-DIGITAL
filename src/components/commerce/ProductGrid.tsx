import { useTranslations } from "next-intl";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/shared/States";
import type { LocalizedProduct } from "@/lib/catalog";

export function ProductGrid({ products }: { products: NonNullable<LocalizedProduct>[] }) {
  const t = useTranslations("shop");

  if (products.length === 0) {
    return <EmptyState title={t("empty")} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
