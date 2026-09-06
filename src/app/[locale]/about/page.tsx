import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-2xl flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
        <p className="text-lg text-brand-navy-soft">{t("intro")}</p>

        <div>
          <h2 className="mb-2 text-xl font-bold text-brand-navy">{t("philosophyTitle")}</h2>
          <p className="text-brand-navy-soft">{t("philosophy")}</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold text-brand-navy">{t("careTitle")}</h2>
          <p className="text-brand-navy-soft">{t("care")}</p>
        </div>

        <p className="rounded-xl border border-dashed border-brand-line bg-white p-4 text-sm italic text-brand-navy-soft">
          {t("contentPending")}
        </p>
      </Container>
    </div>
  );
}
