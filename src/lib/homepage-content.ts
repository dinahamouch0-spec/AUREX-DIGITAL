import { prisma } from "@/lib/prisma";
import type { HomepageContent } from "@prisma/client";

export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const existing = await prisma.homepageContent.findUnique({ where: { id: "singleton" } });
    if (existing) return existing;
    return await prisma.homepageContent.create({ data: { id: "singleton" } });
  } catch {
    return {
      id: "singleton",
      heroHeadlineAr: null,
      heroHeadlineEn: null,
      heroSubheadlineAr: null,
      heroSubheadlineEn: null,
      finalCtaHeadlineAr: null,
      finalCtaHeadlineEn: null,
      featuredProductIds: [],
      updatedAt: new Date(),
    };
  }
}
