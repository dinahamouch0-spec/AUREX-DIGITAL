import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { products: true } } },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    status: c.status,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    ar: c.translations.find((t) => t.locale === "ar")?.name ?? "",
    en: c.translations.find((t) => t.locale === "en")?.name ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Categories</h1>
      <CategoriesManager initial={rows} />
    </div>
  );
}
