import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { products: true } } },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      status: c.status,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
      ar: c.translations.find((t) => t.locale === "ar")?.name ?? "",
      en: c.translations.find((t) => t.locale === "en")?.name ?? "",
    })),
  });
}

const createSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  ar: z.string().min(1),
  en: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });

  const category = await prisma.category.create({
    data: {
      slug: parsed.data.slug,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      translations: {
        create: [
          { locale: "ar", name: parsed.data.ar },
          { locale: "en", name: parsed.data.en },
        ],
      },
    },
  });

  return NextResponse.json({ id: category.id }, { status: 201 });
}
