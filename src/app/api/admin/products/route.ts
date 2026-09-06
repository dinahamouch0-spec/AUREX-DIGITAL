import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { translations: true, category: { include: { translations: true } } },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      featured: p.featured,
      name: p.translations.find((t) => t.locale === "en")?.name ?? p.slug,
      category: p.category.translations.find((t) => t.locale === "en")?.name ?? p.category.slug,
      updatedAt: p.updatedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await req.json().catch(() => ({}));
  const slug: string = json.slug || `new-product-${Date.now()}`;

  const category = await prisma.category.findFirst({ where: { status: "active" } });
  if (!category) {
    return NextResponse.json({ error: "NO_CATEGORY" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      slug,
      categoryId: category.id,
      status: "draft",
      pricingMode: "fixed",
      translations: {
        create: [
          { locale: "ar", name: "منتج جديد" },
          { locale: "en", name: "New Product" },
        ],
      },
    },
  });

  return NextResponse.json({ id: product.id }, { status: 201 });
}
