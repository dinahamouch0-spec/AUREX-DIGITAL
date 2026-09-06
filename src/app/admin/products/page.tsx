import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-800",
  archived: "bg-gray-200 text-gray-600",
  unavailable: "bg-amber-100 text-amber-800",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { translations: true, category: { include: { translations: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink-deep"
        >
          + Add Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-brand-line text-xs uppercase text-brand-navy-soft">
              <th className="px-5 py-3 text-start">Name</th>
              <th className="px-5 py-3 text-start">Category</th>
              <th className="px-5 py-3 text-start">Status</th>
              <th className="px-5 py-3 text-start">Featured</th>
              <th className="px-5 py-3 text-start">Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-brand-navy-soft">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-brand-line last:border-0 hover:bg-ivory-deep">
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-brand-pink-deep hover:underline">
                      {p.translations.find((t) => t.locale === "en")?.name ?? p.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {p.category.translations.find((t) => t.locale === "en")?.name ?? p.category.slug}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", STATUS_COLORS[p.status])}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{p.featured ? "★" : ""}</td>
                  <td className="px-5 py-3 text-brand-navy-soft">{p.updatedAt.toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
