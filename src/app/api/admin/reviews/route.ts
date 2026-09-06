import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  customerName: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  ar: z.string().min(1),
  en: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const maxSort = await prisma.review.aggregate({ _max: { sortOrder: true } });

  const review = await prisma.review.create({
    data: {
      customerName: parsed.data.customerName,
      rating: parsed.data.rating ?? null,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      published: true,
      translations: {
        create: [
          { locale: "ar", body: parsed.data.ar },
          { locale: "en", body: parsed.data.en },
        ],
      },
    },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
