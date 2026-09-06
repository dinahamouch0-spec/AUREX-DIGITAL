import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { MessageCircle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorksPage" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("howItWorksPage");
  const steps = t.raw("steps") as { title: string; description: string }[];

  return (
    <div className="py-14 sm:py-20">
      <Container className="flex flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-brand-navy-soft">{t("subtitle")}</p>
        </div>

        <ol className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-sm font-extrabold text-brand-pink-deep">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-brand-navy">{step.title}</p>
                <p className="text-sm text-brand-navy-soft">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mx-auto flex max-w-md items-center gap-2 rounded-xl bg-blush/60 p-4 text-center text-sm text-brand-navy-soft">
          <MessageCircle className="h-4 w-4 shrink-0 text-brand-pink-deep" aria-hidden="true" />
          {t("approvalNote")}
        </p>

        <div className="text-center">
          <Button href="/shop" size="lg">
            {locale === "ar" ? "ابدأ الآن" : "Start Personalizing"}
          </Button>
        </div>
      </Container>
    </div>
  );
}
