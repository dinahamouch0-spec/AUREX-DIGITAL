import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  businessName: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
  whatsappNumber: z.string(),
  instagramUrl: z.string().nullable().optional(),
  whishNumber: z.string(),
  businessEmail: z.string().nullable().optional(),
  adminNotifyEmail: z.string().nullable().optional(),
  productionDays: z.string().min(1),
  photoRetentionHours: z.number().int().min(1),
  tempUploadRetentionHours: z.number().int().min(1),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });

  await prisma.auditLogEntry.create({
    data: { actorId: guard.session.sub, action: "settings_updated" },
  });

  return NextResponse.json({ ok: true });
}
