import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  heroHeadlineAr: z.string().nullable(),
  heroHeadlineEn: z.string().nullable(),
  heroSubheadlineAr: z.string().nullable(),
  heroSubheadlineEn: z.string().nullable(),
  finalCtaHeadlineAr: z.string().nullable(),
  finalCtaHeadlineEn: z.string().nullable(),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
  );

  await prisma.homepageContent.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
