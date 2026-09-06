import { redirect } from "next/navigation";
import Link from "next/link";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export default async function NewProductPage() {
  const category = await prisma.category.findFirst({ where: { status: "active" } });

  if (!category) {
    return (
      <div className="rounded-2xl border border-brand-line bg-white p-8 text-center">
        <p className="font-semibold text-brand-navy">Create a category first</p>
        <p className="mt-1 text-sm text-brand-navy-soft">
          A product needs a category to belong to.
        </p>
        <Link href="/admin/categories" className="mt-4 inline-block rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white">
          Go to Categories
        </Link>
      </div>
    );
  }

  // This route handler intentionally performs a one-time create-on-visit
  // mutation (the "+ Add Product" button navigates straight here) — a
  // random slug is required for uniqueness before the admin renames it.
  const product = await prisma.product.create({
    data: {
      slug: `new-product-${nanoid(8)}`,
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

  redirect(`/admin/products/${product.id}`);
}
