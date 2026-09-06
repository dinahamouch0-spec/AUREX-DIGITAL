import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";
import { formatCentsUSD } from "@/lib/pricing";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("confirmation");
  const tCheckout = await getTranslations("checkout");
  const activeLocale = (await getLocale()) as "ar" | "en";

  const order = await prisma.order.findUnique({
    where: { confirmationToken: token },
    include: { items: true },
  });

  if (!order) notFound();

  const settings = await getBusinessSettings();
  const message = t("whatsappMessage", { orderNumber: order.orderNumber });
  const waLink = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, message) : null;

  return (
    <div className="py-14 sm:py-20">
      <Container className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-brand-pink-deep">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
        <p className="text-brand-navy-soft">{t("message")}</p>

        <div className="w-full rounded-[var(--radius-card)] border border-brand-line bg-white p-6 text-start">
          <div className="flex items-center justify-between border-b border-brand-line pb-4">
            <span className="text-sm text-brand-navy-soft">{t("orderNumber")}</span>
            <span className="text-lg font-extrabold text-brand-pink-deep">{order.orderNumber}</span>
          </div>
          <ul className="flex flex-col gap-2 border-b border-brand-line py-4 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="text-brand-navy-soft">
                  {item.productNameSnapshot} × {item.quantity}
                </span>
                <span className="font-semibold text-brand-navy">
                  {formatCentsUSD(item.lineTotalCents, activeLocale)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-navy-soft">{t("productsSubtotal")}</span>
              <span className="font-semibold text-brand-navy">
                {formatCentsUSD(order.productsSubtotalCents, activeLocale)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-soft">{t("shipping")}</span>
              <span className="font-semibold text-brand-navy">{tCheckout("shippingTbc")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-soft">{t("paymentMethod")}</span>
              <span className="font-semibold text-brand-navy">
                {order.paymentMethod === "cod" ? tCheckout("cod") : tCheckout("whish")}
              </span>
            </div>
          </div>
        </div>

        {waLink && (
          <Button href={waLink} target="_blank" rel="noopener noreferrer" size="lg">
            {t("continueWhatsApp")}
          </Button>
        )}
        <Button href="/shop" variant="outline">
          {tCheckout("reviewOrder")}
        </Button>
      </Container>
    </div>
  );
}
