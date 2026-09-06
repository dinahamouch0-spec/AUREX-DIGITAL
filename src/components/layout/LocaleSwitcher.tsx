"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import Link from "next/link";
import { Globe } from "lucide-react";
import { cn } from "@/lib/cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={`/${other}${pathname === "/" ? "" : pathname}`}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand-line bg-white px-3.5 py-2 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-pink hover:text-brand-pink",
        className
      )}
      aria-label={other === "ar" ? "التبديل إلى العربية" : "Switch to English"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {other === "ar" ? "العربية" : "EN"}
    </Link>
  );
}
