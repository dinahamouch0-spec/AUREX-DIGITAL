import { useLocale } from "next-intl";
import { formatCentsUSD } from "@/lib/pricing";

export function PriceDisplay({
  cents,
  className,
  prefix,
}: {
  cents: number;
  className?: string;
  prefix?: string;
}) {
  const locale = useLocale() as "ar" | "en";
  return (
    <span className={className}>
      {prefix ? `${prefix} ` : ""}
      {formatCentsUSD(cents, locale)}
    </span>
  );
}
