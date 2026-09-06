"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, Trash2 } from "lucide-react";
import { formatCentsUSD } from "@/lib/pricing";
import type { CartItem } from "@/store/cart";

export function CartItemCard({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("cart");
  const locale = useLocale() as "ar" | "en";

  return (
    <div className="flex gap-4 rounded-[var(--radius-card)] border border-brand-line bg-white p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-blush">
        {item.image && (
          <Image src={item.image} alt={item.productName} fill className="object-cover" unoptimized />
        )}
      </div>

      <div className="flex min-w-0 grow flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-brand-navy">{item.productName}</p>
            {item.childName && (
              <p className="text-sm text-brand-navy-soft">{item.childName}</p>
            )}
          </div>
          <p className="shrink-0 font-bold text-brand-pink-deep">
            {formatCentsUSD(item.lineTotalCents, locale)}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-navy-soft">
          {item.answersDisplay.slice(0, 3).map((a) => (
            <span key={a.fieldKey}>
              {a.label}: <span className="font-medium text-brand-navy">{a.valueLabel}</span>
            </span>
          ))}
          <span>
            {t("photoStatus")}:{" "}
            {item.hasPhoto ? (
              <span className="inline-flex items-center gap-0.5 font-medium text-green-700">
                <Check className="h-3 w-3" aria-hidden="true" /> ✓
              </span>
            ) : (
              "—"
            )}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-4 pt-2">
          <Link
            href={`/product/${item.productSlug}?edit=${item.id}`}
            className="text-sm font-semibold text-brand-pink-deep hover:underline"
          >
            {t("editItem")}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy-soft hover:text-brand-pink-deep"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("removeItem")}
          </button>
        </div>
      </div>
    </div>
  );
}
