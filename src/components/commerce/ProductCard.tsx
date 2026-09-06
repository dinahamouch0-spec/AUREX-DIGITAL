import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { estimateStartingPriceCents } from "@/lib/pricing";
import { PriceDisplay } from "./PriceDisplay";
import { AvailabilityBadge } from "./AvailabilityBadge";
import type { LocalizedProduct } from "@/lib/catalog";

export function ProductCard({ product }: { product: NonNullable<LocalizedProduct> }) {
  const t = useTranslations("featured");
  const tCommon = useTranslations("common");
  const available = product.status === "active";
  const startingCents = estimateStartingPriceCents(product);
  const image = product.images[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-blush"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-navy-soft">
            {product.name}
          </div>
        )}
        <div className="absolute top-3 start-3">
          <AvailabilityBadge available={available} />
        </div>
      </Link>
      <div className="flex grow flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-pink-deep">
          {product.category.name}
        </p>
        <h3 className="text-lg font-bold text-brand-navy">
          <Link href={`/product/${product.slug}`} className="hover:text-brand-pink-deep">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="line-clamp-2 text-sm text-brand-navy-soft">{product.shortDescription}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <PriceDisplay
            cents={startingCents}
            prefix={tCommon("startingFrom")}
            className="text-sm font-bold text-brand-navy"
          />
          <Link
            href={`/product/${product.slug}`}
            className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-pink-deep"
          >
            {t("customize")}
          </Link>
        </div>
      </div>
    </div>
  );
}
