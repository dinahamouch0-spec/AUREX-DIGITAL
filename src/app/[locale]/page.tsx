import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FeaturedProducts } from "@/components/marketing/FeaturedProducts";
import { CategoryFeature } from "@/components/marketing/CategoryFeature";
import { CreationsGallery } from "@/components/marketing/CreationsGallery";
import { WhySection } from "@/components/marketing/WhySection";
import { EmotionalMoment } from "@/components/marketing/EmotionalMoment";
import { ReviewSection } from "@/components/marketing/ReviewSection";
import { FaqPreview } from "@/components/marketing/FaqPreview";
import { FinalCta } from "@/components/marketing/FinalCta";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { languages: { ar: "/ar", en: "/en" }, canonical: "/" } };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tStories, tStickers, tNotebooks] = await Promise.all([
    getTranslations("storiesSection"),
    getTranslations("stickersSection"),
    getTranslations("notebooksSection"),
  ]);

  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedProducts />
      <CategoryFeature
        eyebrow={tStories("eyebrow")}
        title={tStories("title")}
        description={tStories("description")}
        cta={tStories("cta")}
        href="/shop/stories"
        imageSrc="/images/showcase/stories.png"
        imageAlt="Ya 7kayti personalized storybooks"
      />
      <CategoryFeature
        eyebrow={tStickers("eyebrow")}
        title={tStickers("title")}
        description={tStickers("description")}
        cta={tStickers("cta")}
        href="/shop/stickers"
        imageSrc="/images/showcase/stickers.png"
        imageAlt="Ya 7kayti personalized stickers"
        reverse
      />
      <CategoryFeature
        eyebrow={tNotebooks("eyebrow")}
        title={tNotebooks("title")}
        description={tNotebooks("description")}
        cta={tNotebooks("cta")}
        href="/shop/notebooks"
        imageSrc="/images/showcase/notebooks.png"
        imageAlt="Ya 7kayti personalized notebook covers"
      />
      <CreationsGallery />
      <WhySection />
      <EmotionalMoment />
      <ReviewSection />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
