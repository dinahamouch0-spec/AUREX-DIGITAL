import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/shared/Button";
import { FaqAccordion } from "./FaqAccordion";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

export async function FaqPreview() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("faqSection");

  const items = await prisma.faqItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
    take: 5,
  });

  if (items.length === 0) return null;

  const localized = items.map((item) => {
    const tr =
      item.translations.find((x) => x.locale === locale) ??
      item.translations.find((x) => x.locale !== locale);
    return { id: item.id, question: tr?.question ?? "", answer: tr?.answer ?? "" };
  });

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mx-auto w-full max-w-2xl">
          <FaqAccordion items={localized} />
        </div>
        <div className="text-center">
          <Button href="/faq" variant="outline">
            {t("viewAll")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
