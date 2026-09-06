import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const updateSchema = z.object({
  ar: z.string().min(1).optional(),
  en: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const { ar, en, sortOrder, status } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (sortOrder !== undefined || status !== undefined) {
      await tx.category.update({ where: { id }, data: { sortOrder, status } });
    }
    if (ar) {
      await tx.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale: "ar" } },
        create: { categoryId: id, locale: "ar", name: ar },
        update: { name: ar },
      });
    }
    if (en) {
      await tx.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale: "en" } },
        create: { categoryId: id, locale: "en", name: en },
        update: { name: en },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

/** Archives rather than deletes — a category with historical products
 * must keep existing. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  await prisma.category.update({ where: { id }, data: { status: "archived" } });
  return NextResponse.json({ ok: true });
}
