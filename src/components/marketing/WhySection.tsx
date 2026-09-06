import { useTranslations } from "next-intl";
import { Heart, Camera, Sparkles, Gift, Languages } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

const icons = [Heart, Camera, Sparkles, Gift, Languages];

export function WhySection() {
  const t = useTranslations("why");
  const pillars = t.raw("pillars") as { title: string; description: string }[];

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((pillar, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={pillar.title}
                className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] bg-ivory p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-brand-pink-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold text-brand-navy">{pillar.title}</h3>
                <p className="text-sm text-brand-navy-soft">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
