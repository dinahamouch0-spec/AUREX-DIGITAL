"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface CategoryRow {
  id: string;
  slug: string;
  status: string;
  sortOrder: number;
  productCount: number;
  ar: string;
  en: string;
}

export function CategoriesManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [newSlug, setNewSlug] = useState("");
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!newSlug || !newAr || !newEn) {
      setError("Fill in slug, Arabic name, and English name.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug, ar: newAr, en: newEn }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error === "SLUG_TAKEN" ? "That slug is already used." : "Could not create category.");
        return;
      }
      setNewSlug("");
      setNewAr("");
      setNewEn("");
      router.refresh();
      const listRes = await fetch("/api/admin/categories");
      if (listRes.ok) setRows((await listRes.json()).categories);
    } finally {
      setCreating(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this category? Existing products stay intact.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "archived" } : r)));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-brand-line bg-white p-5">
        <p className="mb-3 text-sm font-bold text-brand-navy">Add Category</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="slug (e.g. bookmarks)" className="min-h-11 rounded-xl border border-brand-line px-3 text-sm" />
          <input value={newAr} onChange={(e) => setNewAr(e.target.value)} placeholder="الاسم بالعربي" dir="rtl" className="min-h-11 rounded-xl border border-brand-line px-3 text-sm" />
          <input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="English name" className="min-h-11 rounded-xl border border-brand-line px-3 text-sm" />
          <button onClick={handleCreate} disabled={creating} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-pink text-sm font-semibold text-white hover:bg-brand-pink-deep disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-brand-pink-deep">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-brand-line text-xs uppercase text-brand-navy-soft">
              <th className="px-5 py-3 text-start">Slug</th>
              <th className="px-5 py-3 text-start">Arabic</th>
              <th className="px-5 py-3 text-start">English</th>
              <th className="px-5 py-3 text-start">Products</th>
              <th className="px-5 py-3 text-start">Status</th>
              <th className="px-5 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-brand-line last:border-0">
                <td className="px-5 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3" dir="rtl">{c.ar}</td>
                <td className="px-5 py-3">{c.en}</td>
                <td className="px-5 py-3">{c.productCount}</td>
                <td className="px-5 py-3 capitalize">{c.status}</td>
                <td className="px-5 py-3">
                  {c.status === "active" && (
                    <button onClick={() => handleArchive(c.id)} className="flex items-center gap-1 text-xs font-semibold text-brand-navy-soft hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
