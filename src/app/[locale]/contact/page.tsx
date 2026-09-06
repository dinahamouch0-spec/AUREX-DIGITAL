import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MessageCircle, Mail } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { InstagramIcon } from "@/components/shared/InstagramIcon";
import { getBusinessSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const settings = await getBusinessSettings();

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
        <p className="text-brand-navy-soft">{t("subtitle")}</p>

        <div className="mt-6 flex w-full flex-col gap-3">
          {settings.whatsappNumber ? (
            <a
              href={whatsappLink(settings.whatsappNumber, "")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {t("whatsapp")}
            </a>
          ) : (
            <p className="rounded-xl border border-dashed border-brand-line bg-white p-4 text-sm italic text-brand-navy-soft">
              WhatsApp number not configured yet.
            </p>
          )}

          {settings.instagramUrl && (
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand-line px-6 font-semibold text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
            >
              <InstagramIcon className="h-5 w-5" />
              {t("instagram")}
            </a>
          )}

          {settings.businessEmail && (
            <a
              href={`mailto:${settings.businessEmail}`}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand-line px-6 font-semibold text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              {settings.businessEmail}
            </a>
          )}
        </div>
      </Container>
    </div>
  );
}
