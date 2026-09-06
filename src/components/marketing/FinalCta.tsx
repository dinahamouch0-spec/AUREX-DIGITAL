import { getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { getBusinessSettings } from "@/lib/settings";
import { getHomepageContent } from "@/lib/homepage-content";
import { whatsappLink } from "@/lib/whatsapp";

export async function FinalCta() {
  const t = await getTranslations("finalCta");
  const locale = await getLocale();
  const settings = await getBusinessSettings();
  const content = await getHomepageContent();

  const title =
    (locale === "ar" ? content.finalCtaHeadlineAr : content.finalCtaHeadlineEn) || t("title");

  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col items-center gap-6 rounded-[2rem] bg-gradient-to-br from-brand-pink via-brand-pink-deep to-brand-purple px-6 py-14 text-center shadow-[var(--shadow-soft)] sm:px-12">
        <h2 className="max-w-2xl text-2xl font-extrabold text-white sm:text-3xl">
          {title}
        </h2>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href="/shop" size="lg" className="bg-white text-brand-pink-deep hover:bg-ivory">
            {t("primary")}
          </Button>
          {settings.whatsappNumber && (
            <Button
              href={whatsappLink(settings.whatsappNumber, "")}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:border-white hover:text-white hover:bg-white/10"
            >
              {t("secondary")}
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
