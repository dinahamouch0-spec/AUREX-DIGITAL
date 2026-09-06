import type { Metadata } from "next";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { EmptyState } from "@/components/shared/States";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return { title: t("title") };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const activeLocale = (await getLocale()) as Locale;

  const items = await prisma.faqItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  const localized = items.map((item) => {
    const tr =
      item.translations.find((x) => x.locale === activeLocale) ??
      item.translations.find((x) => x.locale !== activeLocale);
    return { id: item.id, question: tr?.question ?? "", answer: tr?.answer ?? "" };
  });

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-2xl flex-col gap-8">
        <h1 className="text-center text-3xl font-extrabold text-brand-navy sm:text-4xl">
          {t("title")}
        </h1>
        {localized.length === 0 ? (
          <EmptyState title="No published questions yet." />
        ) : (
          <FaqAccordion items={localized} />
        )}
      </Container>
    </div>
  );
}
