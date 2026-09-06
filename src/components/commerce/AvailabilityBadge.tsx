import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function AvailabilityBadge({
  available,
  className,
}: {
  available: boolean;
  className?: string;
}) {
  const t = useTranslations("shop");
  if (available) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-navy/85 px-3 py-1 text-xs font-semibold text-white",
        className
      )}
    >
      {t("unavailable")}
    </span>
  );
}
