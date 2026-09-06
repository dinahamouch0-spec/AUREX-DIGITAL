"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/shared/Button";
import { CartItemCard } from "./CartItemCard";
import { useCartStore, cartSubtotalCents } from "@/store/cart";
import { useHasMounted } from "@/lib/use-has-mounted";
import { formatCentsUSD } from "@/lib/pricing";

export function CartView() {
  const t = useTranslations("cart");
  const locale = useLocale() as "ar" | "en";
  const { items, removeItem } = useCartStore();
  const mounted = useHasMounted();

  if (!mounted) return null;

  const subtotal = cartSubtotalCents(items);

  return (
    <div className="py-10 sm:py-14">
      <Container className="flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-brand-pink" aria-hidden="true" />}
            title={t("empty")}
            action={<Button href="/shop">{t("emptyCta")}</Button>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>

            <div className="h-fit rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <span className="font-semibold text-brand-navy">{t("subtotal")}</span>
                <span className="text-xl font-extrabold text-brand-pink-deep">
                  {formatCentsUSD(subtotal, locale)}
                </span>
              </div>
              <Button href="/checkout" size="lg" className="mt-4 w-full">
                {t("checkout")}
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
