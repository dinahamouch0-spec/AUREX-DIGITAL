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
  return { title: t("privacyTitle") };
}

const CONTENT = {
  ar: {
    sections: [
      { h: "ما هي المعلومات التي نجمعها", p: "اسم العميل، رقم الهاتف، البريد الإلكتروني (إن توفر)، عنوان التوصيل، واسم الطفل وصورته وتفاصيل التخصيص التي تُدخلها عند إنشاء طلب." },
      { h: "لماذا نطلب صورة الطفل", p: "نستخدم صورة الطفل حصريًا لتصميم وتحضير المنتج الشخصي الذي طلبته." },
      { h: "الغرض من الاستخدام", p: "تُستخدم بياناتك فقط لتجهيز طلبك، التواصل معك بخصوصه، وتنسيق الدفع والتوصيل." },
      { h: "كيف يتم تخزين الصورة", p: "تُخزَّن صورة الطفل في مساحة تخزين خاصة وغير عامة، ولا يوجد رابط عام دائم يؤدي إليها." },
      { h: "من يمكنه الوصول إليها", p: "فقط الفريق المخوّل في يا حكايتي عبر تسجيل دخول آمن، لغرض تجهيز الطلب." },
      { h: "متى يتم حذفها", p: "تُحذف صورة الطفل خلال فترة قصيرة بعد اكتمال الطلب وفق سياسة الاحتفاظ المعتمدة لدينا." },
      { h: "الصور غير المستخدمة", p: "أي صورة تُرفع ولا يُستكمل طلبها تُحذف تلقائيًا بعد فترة زمنية محددة." },
      { h: "الفصل بين التسويق والتنفيذ", p: "رفع صورة طفلك لغرض تنفيذ الطلب لا يعني موافقتك على استخدامها لأغراض تسويقية. لا نستخدم صور العملاء في التسويق دون إذن صريح ومنفصل." },
      { h: "أسئلة الخصوصية", p: "لأي استفسار يخص الخصوصية، يرجى التواصل معنا عبر معلومات التواصل الموجودة في الموقع." },
    ],
    disclaimer: "هذه الصفحة تصف ممارساتنا التشغيلية الفعلية، وسيتم استكمالها بمراجعة قانونية نهائية من صاحبة العمل.",
  },
  en: {
    sections: [
      { h: "What information we collect", p: "Customer name, phone number, email (if provided), delivery address, and the child's name, photo, and customization details entered when placing an order." },
      { h: "Why we ask for the child's photo", p: "The photo is used exclusively to design and prepare the personalized product you ordered." },
      { h: "Purpose of use", p: "Your data is used only to prepare your order, communicate with you about it, and coordinate payment and delivery." },
      { h: "How the photo is stored", p: "The child's photo is stored in private, non-public storage. There is no permanent public link to it." },
      { h: "Who can access it", p: "Only authorized Ya 7kayti team members, via secure login, for the purpose of fulfilling your order." },
      { h: "When it is deleted", p: "The child's photo is deleted within a short window after the order is completed, per our retention policy." },
      { h: "Unused uploads", p: "Any photo uploaded but never used in a completed order is automatically deleted after a set period." },
      { h: "Marketing is separate", p: "Uploading your child's photo to fulfill an order does not imply consent to use it for marketing. We never use customer photos for marketing without separate, explicit permission." },
      { h: "Privacy questions", p: "For any privacy question, please reach out via the contact information on this site." },
    ],
    disclaimer: "This page describes our actual operational practices and will be finalized with a legal review by the business owner.",
  },
};

export default async function PrivacyPage({
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
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("privacyTitle")}</h1>
        {content.sections.map((s) => (
          <div key={s.h}>
            <h2 className="mb-1 text-lg font-bold text-brand-navy">{s.h}</h2>
            <p className="text-sm text-brand-navy-soft">{s.p}</p>
          </div>
        ))}
        {settings.businessEmail && (
          <p className="text-sm text-brand-navy-soft">
            {activeLocale === "ar" ? "تواصل:" : "Contact:"} {settings.businessEmail}
          </p>
        )}
        <p className="rounded-xl border border-dashed border-brand-line bg-white p-4 text-xs italic text-brand-navy-soft">
          {content.disclaimer}
        </p>
      </Container>
    </div>
  );
}
