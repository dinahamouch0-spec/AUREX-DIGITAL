import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { EmptyState } from "@/components/shared/States";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

export async function CreationsGallery() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("portfolio");

  const items = await prisma.portfolioItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
    take: 9,
  });

  const localized = items.map((item) => {
    const tr =
      item.translations.find((x) => x.locale === locale) ??
      item.translations.find((x) => x.locale !== locale);
    return { id: item.id, imageUrl: item.imageUrl, caption: tr?.caption ?? "" };
  });

  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        {localized.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
            {localized.map((item) => (
              <figure
                key={item.id}
                className="break-inside-avoid overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || "Ya 7kayti"}
                    fill
                    sizes="(min-width: 640px) 30vw, 45vw"
                    className="object-cover"
                  />
                </div>
                {item.caption && (
                  <figcaption className="p-3 text-sm text-brand-navy-soft">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
