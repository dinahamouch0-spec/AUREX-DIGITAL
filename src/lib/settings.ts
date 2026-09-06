import { prisma } from "@/lib/prisma";
import type { BusinessSettings } from "@prisma/client";

const FALLBACK: Omit<BusinessSettings, "id" | "updatedAt"> = {
  businessName: "Ya 7kayti",
  logoUrl: null,
  whatsappNumber: "",
  instagramUrl: null,
  whishNumber: "",
  businessEmail: null,
  adminNotifyEmail: null,
  productionDays: "2-5",
  photoRetentionHours: 24,
  tempUploadRetentionHours: 48,
};

/** Business settings are a tiny singleton row, safe to fetch per-request —
 * Next.js request memoization de-dupes repeated calls within one render. */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const existing = await prisma.businessSettings.findUnique({
      where: { id: "singleton" },
    });
    if (existing) return existing;
    return await prisma.businessSettings.create({
      data: { id: "singleton", ...FALLBACK },
    });
  } catch {
    // DB unreachable at build/preview time — fail soft with fallback values
    return { id: "singleton", updatedAt: new Date(), ...FALLBACK };
  }
}
