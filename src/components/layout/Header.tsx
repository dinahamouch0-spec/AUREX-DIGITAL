"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartButton } from "./CartButton";
import { Button } from "@/components/shared/Button";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/cn";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Adjust state during render (React's recommended pattern) instead of
  // an effect, so the menu closes on the same render as the route change.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/shop/stories", label: t("stories") },
    { href: "/shop/stickers", label: t("stickers") },
    { href: "/shop/notebooks", label: t("notebooks") },
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled
          ? "border-brand-line bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/75"
          : "border-transparent bg-ivory"
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-[var(--shadow-card)]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-brand-navy-soft transition-colors hover:bg-blush hover:text-brand-pink-deep"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher className="max-sm:hidden" />
          <CartButton />
          <Button href="/shop" size="sm" className="max-lg:hidden">
            {t("startPersonalizing")}
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : t("menu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-navy hover:bg-blush lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <MobileNav open={open} links={links} onClose={() => setOpen(false)} />
    </header>
  );
}
