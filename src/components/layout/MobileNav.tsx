"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "@/components/shared/Button";

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({
  open,
  links,
  onClose,
}: {
  open: boolean;
  links: NavLink[];
  onClose: () => void;
}) {
  const t = useTranslations("nav");

  if (!open) return null;

  return (
    <div
      id="mobile-nav"
      className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-brand-line bg-ivory px-4 pb-8 pt-4 shadow-[var(--shadow-card)] lg:hidden"
    >
      <nav aria-label="Mobile" className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="min-h-12 rounded-xl px-4 py-3 text-base font-semibold text-brand-navy hover:bg-blush"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-line pt-4">
        <LocaleSwitcher />
        <Button href="/shop" onClick={onClose} className="grow">
          {t("startPersonalizing")}
        </Button>
      </div>
    </div>
  );
}
