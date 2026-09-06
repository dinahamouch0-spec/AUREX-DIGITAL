import type { Metadata } from "next";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { getBusinessSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policies" });
  return { title: t("shippingTitle") };
}

const CONTENT = {
  ar: {
    sections: [
      { h: "مدة التصميم والتحضير", p: "عادةً بين 2 و5 أيام لتصميم منتجك وتجهيزه للطباعة." },
      { h: "مدة التوصيل", p: "منفصلة عن مدة التحضير، وتعتمد على موقعك. نتواصل معك بعد الطلب لتأكيد تفاصيل وتكلفة الشحن." },
      { h: "تكلفة الشحن", p: "تُحدَّد بالتنسيق المباشر معك بعد تقديم الطلب، ولا تُفرض تلقائيًا كسعر ثابت." },
      { h: "التتبع", p: "سنبقيك على اطلاع بحالة طلبك عبر واتساب." },
    ],
    disclaimer: "سيتم تحديث هذه الصفحة عند اعتماد شريك شحن أو أسعار ثابتة.",
  },
  en: {
    sections: [
      { h: "Production time", p: "Usually 2-5 days to design your product and prepare it for print." },
      { h: "Delivery time", p: "Separate from production time and depends on your location. We reach out after your order to confirm shipping details and cost." },
      { h: "Shipping cost", p: "Coordinated directly with you after your order is placed — not an automatic flat rate." },
      { h: "Tracking", p: "We'll keep you updated on your order status over WhatsApp." },
    ],
    disclaimer: "This page will be updated once a shipping partner or fixed rates are finalized.",
  },
};

export default async function ShippingPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("policies");
  const activeLocale = (await getLocale()) as "ar" | "en";
  const settings = await getBusinessSettings();
  const content = CONTENT[activeLocale];

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("shippingTitle")}</h1>
        <p className="rounded-xl bg-blush/60 p-4 text-sm text-brand-navy">
          {activeLocale === "ar" ? `مدة التصميم الحالية: ${settings.productionDays} أيام` : `Current production time: ${settings.productionDays} days`}
        </p>
        {content.sections.map((s) => (
          <div key={s.h}>
            <h2 className="mb-1 text-lg font-bold text-brand-navy">{s.h}</h2>
            <p className="text-sm text-brand-navy-soft">{s.p}</p>
          </div>
        ))}
        <p className="rounded-xl border border-dashed border-brand-line bg-white p-4 text-xs italic text-brand-navy-soft">
          {content.disclaimer}
        </p>
      </Container>
    </div>
  );
}
