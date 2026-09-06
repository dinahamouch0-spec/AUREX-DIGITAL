import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps") as { number: string; title: string; description: string }[];

  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-sm font-extrabold text-brand-pink-deep"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-brand-navy">{step.title}</h3>
              <p className="text-sm text-brand-navy-soft">{step.description}</p>
              {i < steps.length - 1 && (
                <span
                  className="absolute top-1/2 hidden h-px w-5 -translate-y-1/2 bg-brand-line lg:block ltr:-right-5 rtl:-left-5"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
