import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Sparkles, Star, Heart } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { getHomepageContent } from "@/lib/homepage-content";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const content = await getHomepageContent();

  const headline =
    (locale === "ar" ? content.heroHeadlineAr : content.heroHeadlineEn) || t("headline");
  const subheadline =
    (locale === "ar" ? content.heroSubheadlineAr : content.heroSubheadlineEn) ||
    t("subheadline");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush via-ivory to-ivory">
      <Star
        className="absolute start-[6%] top-16 h-5 w-5 text-brand-gold animate-ya-sparkle motion-reduce:animate-none"
        aria-hidden="true"
      />
      <Sparkles
        className="absolute end-[10%] top-24 h-6 w-6 text-brand-purple-soft animate-ya-sparkle motion-reduce:animate-none [animation-delay:0.8s]"
        aria-hidden="true"
      />
      <Star
        className="absolute end-[24%] bottom-8 hidden h-4 w-4 text-brand-pink-soft animate-ya-sparkle motion-reduce:animate-none [animation-delay:1.2s] sm:block"
        aria-hidden="true"
      />

      <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-pink-deep shadow-sm">
            {t("eyebrow")}
          </span>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-brand-navy sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="max-w-lg text-base text-brand-navy-soft sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="/shop" size="lg">
              {t("primaryCta")}
            </Button>
            <Button href="/shop" variant="outline" size="lg">
              {t("secondaryCta")}
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-pink-soft/40 via-brand-purple-soft/30 to-brand-gold-soft/40 blur-2xl" />
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]">
            <Image
              src="/images/showcase/stories.png"
              alt="Ya 7kayti personalized storybooks — real product examples"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-5 -start-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">
            <Heart className="h-4 w-4 text-brand-pink" aria-hidden="true" fill="currentColor" />
            <span className="text-xs font-semibold text-brand-navy">Ya 7kayti</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
