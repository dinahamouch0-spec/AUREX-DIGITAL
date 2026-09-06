import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Text+icon wordmark in brand colors. The real Ya 7kayti logo file (as
 * seen in the approved promo assets) is not yet supplied as a standalone
 * asset — this stands in for it and reads from Settings.logoUrl once an
 * owner uploads one via the Admin Dashboard.
 */
export function Logo({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span className={className}>
      <span className="inline-flex items-center gap-2 font-extrabold">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-purple text-white shadow-[var(--shadow-soft)]">
          <BookOpen className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-lg text-brand-navy">{t("brand")}</span>
        </span>
      </span>
    </span>
  );
}
