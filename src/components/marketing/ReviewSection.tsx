import { getLocale, getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

/** Renders nothing at all when there are no published reviews — no
 * fabricated testimonials, no "coming soon" placeholder cluttering the
 * homepage. */
export async function ReviewSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("reviews");

  const reviews = await prisma.review.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
    take: 6,
  });

  if (reviews.length === 0) return null;

  const localized = reviews.map((r) => {
    const tr =
      r.translations.find((x) => x.locale === locale) ??
      r.translations.find((x) => x.locale !== locale);
    return { id: r.id, name: r.customerName, rating: r.rating, body: tr?.body ?? "" };
  });

  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {localized.map((review) => (
            <figure
              key={review.id}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
            >
              {review.rating && (
                <div className="flex gap-0.5 text-brand-gold" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      fill={i < review.rating! ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              )}
              <blockquote className="text-sm text-brand-navy-soft">{review.body}</blockquote>
              <figcaption className="text-sm font-semibold text-brand-navy">
                {review.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
