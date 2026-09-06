import { prisma } from "@/lib/prisma";
import type { Locale } from "@prisma/client";

export const DEFAULT_TEMPLATES: Record<string, Record<Locale, string>> = {
  order_confirmation: {
    ar: "مرحبًا {name} ✨ نتواصل معك من Ya 7kayti بخصوص طلبك #{orderNumber}.",
    en: "Hi {name} ✨ This is Ya 7kayti reaching out about your order #{orderNumber}.",
  },
  design_ready: {
    ar: "تصميم طلبك #{orderNumber} أصبح جاهزًا للمراجعة ✨",
    en: "The design for your order #{orderNumber} is ready for review ✨",
  },
  ready_shipping: {
    ar: "طلبك #{orderNumber} أصبح جاهزًا للتوصيل 📦",
    en: "Your order #{orderNumber} is ready for delivery 📦",
  },
};

export async function getWhatsappTemplate(
  key: string,
  locale: Locale
): Promise<string> {
  const row = await prisma.whatsappTemplate.findUnique({
    where: { key_locale: { key, locale } },
  });
  return row?.body ?? DEFAULT_TEMPLATES[key]?.[locale] ?? "";
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, v),
    template
  );
}
