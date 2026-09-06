import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtl } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Loader } from "@/components/layout/Loader";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(base),
    title: {
      default: `Ya 7kayti | يا حكايتي — ${t("headline")}`,
      template: "%s | Ya 7kayti",
    },
    description: t("subheadline"),
    // Deliberately no alternates.languages here — a blanket "/ar" and
    // "/en" would be wrong for every page except the homepage. Pages that
    // need hreflang (home, shop, category, product) set their own.
    openGraph: {
      siteName: "Ya 7kayti",
      locale: locale === "ar" ? "ar_LB" : "en_US",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={cairo.variable}>
      <body className="min-h-screen bg-ivory font-sans text-brand-navy antialiased">
        <NextIntlClientProvider>
          <Loader />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
