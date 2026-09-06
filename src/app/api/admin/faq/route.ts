import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  arQuestion: z.string().min(1),
  arAnswer: z.string().min(1),
  enQuestion: z.string().min(1),
  enAnswer: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const maxSort = await prisma.faqItem.aggregate({ _max: { sortOrder: true } });

  const item = await prisma.faqItem.create({
    data: {
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      published: true,
      translations: {
        create: [
          { locale: "ar", question: parsed.data.arQuestion, answer: parsed.data.arAnswer },
          { locale: "en", question: parsed.data.enQuestion, answer: parsed.data.enAnswer },
        ],
      },
    },
  });

  return NextResponse.json({ id: item.id }, { status: 201 });
}
