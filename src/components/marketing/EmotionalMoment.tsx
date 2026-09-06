import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";

export function EmotionalMoment() {
  const t = useTranslations("moment");

  return (
    <section className="bg-brand-navy py-16 text-center sm:py-20">
      <Container>
        <p className="mx-auto max-w-2xl text-2xl font-bold leading-relaxed text-white sm:text-3xl">
          {t("line1")}
          <br />
          <span className="bg-gradient-to-r from-brand-pink-soft to-brand-gold-soft bg-clip-text text-transparent">
            {t("line2")}
          </span>
        </p>
      </Container>
    </section>
  );
}
