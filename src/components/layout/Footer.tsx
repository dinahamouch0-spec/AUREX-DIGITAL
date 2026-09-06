import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/shared/InstagramIcon";
import { Logo } from "./Logo";
import { Container } from "@/components/shared/Container";
import { getBusinessSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const settings = await getBusinessSettings();

  const shopLinks = [
    { href: "/shop", label: tNav("shop") },
    { href: "/shop/stories", label: tNav("stories") },
    { href: "/shop/stickers", label: tNav("stickers") },
    { href: "/shop/notebooks", label: tNav("notebooks") },
  ];

  const companyLinks = [
    { href: "/how-it-works", label: tNav("howItWorks") },
    { href: "/about", label: tNav("about") },
    { href: "/faq", label: tNav("faq") },
    { href: "/contact", label: tNav("contact") },
  ];

  const legalLinks = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/shipping-policy", label: t("shippingPolicy") },
  ];

  return (
    <footer className="border-t border-brand-line bg-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-brand-navy-soft">{t("tagline")}</p>
        </div>

        <FooterColumn heading={t("shopHeading")} links={shopLinks} />
        <FooterColumn heading={t("companyHeading")} links={companyLinks} />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-brand-navy">{t("legalHeading")}</h3>
          <ul className="flex flex-col gap-2">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-brand-navy-soft hover:text-brand-pink-deep">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-2 text-sm font-bold text-brand-navy">{t("followHeading")}</h3>
          <div className="flex items-center gap-2">
            {settings.whatsappNumber && (
              <a
                href={whatsappLink(settings.whatsappNumber, "")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush text-brand-pink-deep hover:bg-brand-pink hover:text-white"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush text-brand-pink-deep hover:bg-brand-pink hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </Container>
      <div className="border-t border-brand-line py-5">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-brand-navy-soft sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings.businessName} — {t("rights")}
          </p>
          <p>{locale === "ar" ? "صُنع بحب لأجل طفلك" : "Made with love for your child"}</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-brand-navy">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-brand-navy-soft hover:text-brand-pink-deep">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
