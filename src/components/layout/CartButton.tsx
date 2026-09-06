"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useHasMounted } from "@/lib/use-has-mounted";
import { cn } from "@/lib/cn";

export function CartButton({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const items = useCartStore((s) => s.items);
  const mounted = useHasMounted();
  const count = mounted ? items.length : 0;

  return (
    <Link
      href="/cart"
      aria-label={`${t("cart")}${count > 0 ? ` (${count})` : ""}`}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-blush hover:text-brand-pink",
        className
      )}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-bold text-white"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
