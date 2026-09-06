import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const STATIC_PATHS = [
  "",
  "/shop",
  "/how-it-works",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/shipping-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const locales = ["ar", "en"] as const;

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])),
        },
      });
    }
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { status: "active" }, select: { slug: true } }),
    prisma.product.findMany({ where: { status: "active" }, select: { slug: true, updatedAt: true } }),
  ]);

  for (const category of categories) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/shop/${category.slug}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${base}/${l}/shop/${category.slug}`])
          ),
        },
      });
    }
  }

  for (const product of products) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/product/${product.slug}`,
        lastModified: product.updatedAt,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${base}/${l}/product/${product.slug}`])
          ),
        },
      });
    }
  }

  return entries;
}
