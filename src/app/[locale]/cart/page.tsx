import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/commerce/CartView";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartView />;
}
