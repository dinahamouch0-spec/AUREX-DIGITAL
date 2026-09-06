import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  imageUrl: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const maxSort = await prisma.portfolioItem.aggregate({ _max: { sortOrder: true } });

  const item = await prisma.portfolioItem.create({
    data: {
      imageUrl: parsed.data.imageUrl,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      published: true,
      translations: {
        create: [
          { locale: "ar", caption: parsed.data.ar },
          { locale: "en", caption: parsed.data.en },
        ],
      },
    },
  });

  return NextResponse.json({ id: item.id }, { status: 201 });
}
