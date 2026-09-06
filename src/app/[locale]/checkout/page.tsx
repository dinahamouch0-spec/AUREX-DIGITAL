import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CheckoutView } from "@/components/commerce/CheckoutView";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getBusinessSettings();
  return <CheckoutView whishNumber={settings.whishNumber} />;
}
