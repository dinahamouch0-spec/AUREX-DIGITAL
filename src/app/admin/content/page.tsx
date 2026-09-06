import { prisma } from "@/lib/prisma";
import { getHomepageContent } from "@/lib/homepage-content";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function AdminContentPage() {
  const [content, portfolioItems, reviews, faqItems] = await Promise.all([
    getHomepageContent(),
    prisma.portfolioItem.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.review.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Content</h1>
      <ContentManager
        homepageCopy={{
          heroHeadlineAr: content.heroHeadlineAr ?? "",
          heroHeadlineEn: content.heroHeadlineEn ?? "",
          heroSubheadlineAr: content.heroSubheadlineAr ?? "",
          heroSubheadlineEn: content.heroSubheadlineEn ?? "",
          finalCtaHeadlineAr: content.finalCtaHeadlineAr ?? "",
          finalCtaHeadlineEn: content.finalCtaHeadlineEn ?? "",
        }}
        portfolio={portfolioItems.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          published: p.published,
          ar: p.translations.find((t) => t.locale === "ar")?.caption ?? "",
          en: p.translations.find((t) => t.locale === "en")?.caption ?? "",
        }))}
        reviews={reviews.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          rating: r.rating,
          published: r.published,
          ar: r.translations.find((t) => t.locale === "ar")?.body ?? "",
          en: r.translations.find((t) => t.locale === "en")?.body ?? "",
        }))}
        faq={faqItems.map((f) => ({
          id: f.id,
          published: f.published,
          arQuestion: f.translations.find((t) => t.locale === "ar")?.question ?? "",
          arAnswer: f.translations.find((t) => t.locale === "ar")?.answer ?? "",
          enQuestion: f.translations.find((t) => t.locale === "en")?.question ?? "",
          enAnswer: f.translations.find((t) => t.locale === "en")?.answer ?? "",
        }))}
      />
    </div>
  );
}
