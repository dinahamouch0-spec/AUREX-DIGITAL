import type { Metadata } from "next";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/components/shared/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policies" });
  return { title: t("termsTitle") };
}

const CONTENT = {
  ar: {
    sections: [
      { h: "الطلبات", p: "كل منتج يُصنع خصيصًا بعد تقديم الطلب بناءً على المعلومات والصورة التي تزوّدنا بها." },
      { h: "الدفع", p: "نوفر الدفع عند الاستلام أو عبر Whish Money. يتم تأكيد تفاصيل الدفع مباشرة معك بعد الطلب." },
      { h: "الشحن والتوصيل", p: "تكلفة ووقت التوصيل يتم تأكيدهما معك بعد تقديم الطلب، بحسب موقعك. مدة التصميم والتحضير منفصلة عن مدة التوصيل." },
      { h: "مراجعة التصميم", p: "قد نشارك معك معاينة للتصميم عبر واتساب قبل الطباعة النهائية." },
      { h: "الإلغاء والتعديل", p: "لأن كل منتج مخصص، يرجى التواصل معنا بأسرع وقت ممكن إذا احتجت تعديل أو إلغاء طلبك." },
    ],
    disclaimer: "سيتم استكمال هذه الصفحة بنص قانوني نهائي من صاحبة العمل.",
  },
  en: {
    sections: [
      { h: "Orders", p: "Every product is made to order, based on the information and photo you provide at checkout." },
      { h: "Payment", p: "We offer Cash on Delivery and Whish Money. Payment details are confirmed with you directly after the order is placed." },
      { h: "Shipping & delivery", p: "Delivery cost and timing are confirmed with you after your order, based on your location. Production time is separate from delivery time." },
      { h: "Design review", p: "We may share a design preview with you over WhatsApp before final printing." },
      { h: "Cancellation & changes", p: "Because every product is personalized, please contact us as soon as possible if you need to change or cancel your order." },
    ],
    disclaimer: "This page will be finalized with final legal copy from the business owner.",
  },
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("policies");
  const activeLocale = (await getLocale()) as "ar" | "en";
  const content = CONTENT[activeLocale];

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("termsTitle")}</h1>
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
