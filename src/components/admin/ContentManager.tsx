"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, Loader2, Check, Star } from "lucide-react";
import { AdminCard } from "./AdminUI";
import { cn } from "@/lib/cn";

interface HomepageCopy {
  heroHeadlineAr: string;
  heroHeadlineEn: string;
  heroSubheadlineAr: string;
  heroSubheadlineEn: string;
  finalCtaHeadlineAr: string;
  finalCtaHeadlineEn: string;
}

interface PortfolioRow {
  id: string;
  imageUrl: string;
  published: boolean;
  ar: string;
  en: string;
}

interface ReviewRow {
  id: string;
  customerName: string;
  rating: number | null;
  published: boolean;
  ar: string;
  en: string;
}

interface FaqRow {
  id: string;
  published: boolean;
  arQuestion: string;
  arAnswer: string;
  enQuestion: string;
  enAnswer: string;
}

export function ContentManager({
  homepageCopy,
  portfolio,
  reviews,
  faq,
}: {
  homepageCopy: HomepageCopy;
  portfolio: PortfolioRow[];
  reviews: ReviewRow[];
  faq: FaqRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <HomepageCopySection initial={homepageCopy} />
      <PortfolioSection initial={portfolio} />
      <ReviewsSection initial={reviews} />
      <FaqSection initial={faq} />
    </div>
  );
}

function SavedTag({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved
    </span>
  );
}

function HomepageCopySection({ initial }: { initial: HomepageCopy }) {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/homepage-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <AdminCard
      title="Homepage Copy"
      action={
        <div className="flex items-center gap-3">
          <SavedTag saved={saved} />
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-full bg-brand-pink px-4 py-2 text-xs font-semibold text-white hover:bg-brand-pink-deep disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Save
          </button>
        </div>
      }
    >
      <p className="mb-3 text-xs text-brand-navy-soft">Leave blank to use the default brand copy.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hero Headline (AR)" value={data.heroHeadlineAr} onChange={(v) => setData({ ...data, heroHeadlineAr: v })} dir="rtl" />
        <Field label="Hero Headline (EN)" value={data.heroHeadlineEn} onChange={(v) => setData({ ...data, heroHeadlineEn: v })} />
        <Field label="Hero Subheadline (AR)" value={data.heroSubheadlineAr} onChange={(v) => setData({ ...data, heroSubheadlineAr: v })} dir="rtl" area />
        <Field label="Hero Subheadline (EN)" value={data.heroSubheadlineEn} onChange={(v) => setData({ ...data, heroSubheadlineEn: v })} area />
        <Field label="Final CTA Headline (AR)" value={data.finalCtaHeadlineAr} onChange={(v) => setData({ ...data, finalCtaHeadlineAr: v })} dir="rtl" />
        <Field label="Final CTA Headline (EN)" value={data.finalCtaHeadlineEn} onChange={(v) => setData({ ...data, finalCtaHeadlineEn: v })} />
      </div>
    </AdminCard>
  );
}

function PortfolioSection({ initial }: { initial: PortfolioRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [imageUrl, setImageUrl] = useState("");
  const [ar, setAr] = useState("");
  const [en, setEn] = useState("");
  const [saving, setSaving] = useState(false);

  async function addItem() {
    if (!imageUrl || !ar || !en) return;
    setSaving(true);
    const res = await fetch("/api/admin/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, ar, en }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setRows((prev) => [...prev, { id, imageUrl, published: true, ar, en }]);
      setImageUrl("");
      setAr("");
      setEn("");
      router.refresh();
    }
    setSaving(false);
  }

  async function togglePublished(row: PortfolioRow) {
    const published = !row.published;
    await fetch(`/api/admin/portfolio/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published } : r)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this showcase item?")) return;
    await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  return (
    <AdminCard title="Previous Creations / Made With Love">
      <p className="mb-3 text-xs text-brand-navy-soft">
        Approved marketing showcase only — never customer fulfillment photos.
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm sm:col-span-2" />
        <input value={ar} onChange={(e) => setAr(e.target.value)} placeholder="Arabic caption" dir="rtl" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm" />
        <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="English caption" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm" />
      </div>
      <button onClick={addItem} disabled={saving} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-pink-deep hover:underline disabled:opacity-60">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add showcase item
      </button>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-xl border border-brand-line p-2">
            <Image
              src={row.imageUrl}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="min-w-0 grow text-xs">
              <p className="truncate font-semibold text-brand-navy">{row.en}</p>
              <p className="truncate text-brand-navy-soft" dir="rtl">{row.ar}</p>
            </div>
            <button onClick={() => togglePublished(row)} className="text-brand-navy-soft hover:text-brand-pink-deep">
              {row.published ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button onClick={() => remove(row.id)} className="text-brand-navy-soft hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function ReviewsSection({ initial }: { initial: ReviewRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [ar, setAr] = useState("");
  const [en, setEn] = useState("");
  const [saving, setSaving] = useState(false);

  async function addItem() {
    if (!customerName || !ar || !en) return;
    setSaving(true);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, rating, ar, en }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setRows((prev) => [...prev, { id, customerName, rating, published: true, ar, en }]);
      setCustomerName("");
      setAr("");
      setEn("");
      router.refresh();
    }
    setSaving(false);
  }

  async function togglePublished(row: ReviewRow) {
    const published = !row.published;
    await fetch(`/api/admin/reviews/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published } : r)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this review?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  return (
    <AdminCard title="Reviews">
      <p className="mb-3 text-xs text-brand-navy-soft">Only add reviews the business actually received. Never fabricate.</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-5">
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm" />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="min-h-10 rounded-lg border border-brand-line px-3 text-sm">
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} stars</option>
          ))}
        </select>
        <input value={ar} onChange={(e) => setAr(e.target.value)} placeholder="Arabic review" dir="rtl" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm sm:col-span-1" />
        <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="English review" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm sm:col-span-2" />
      </div>
      <button onClick={addItem} disabled={saving} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-pink-deep hover:underline disabled:opacity-60">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add review
      </button>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-start gap-3 rounded-xl border border-brand-line p-3 text-xs">
            <div className="min-w-0 grow">
              <p className="flex items-center gap-1 font-semibold text-brand-navy">
                {row.customerName}
                {row.rating && (
                  <span className="flex text-brand-gold">
                    {Array.from({ length: row.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3" fill="currentColor" aria-hidden="true" />
                    ))}
                  </span>
                )}
              </p>
              <p className="mt-1 text-brand-navy-soft">{row.en}</p>
            </div>
            <button onClick={() => togglePublished(row)} className="shrink-0 text-brand-navy-soft hover:text-brand-pink-deep">
              {row.published ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button onClick={() => remove(row.id)} className="shrink-0 text-brand-navy-soft hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function FaqSection({ initial }: { initial: FaqRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [arQuestion, setArQuestion] = useState("");
  const [arAnswer, setArAnswer] = useState("");
  const [enQuestion, setEnQuestion] = useState("");
  const [enAnswer, setEnAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  async function addItem() {
    if (!arQuestion || !arAnswer || !enQuestion || !enAnswer) return;
    setSaving(true);
    const res = await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arQuestion, arAnswer, enQuestion, enAnswer }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setRows((prev) => [...prev, { id, published: true, arQuestion, arAnswer, enQuestion, enAnswer }]);
      setArQuestion("");
      setArAnswer("");
      setEnQuestion("");
      setEnAnswer("");
      router.refresh();
    }
    setSaving(false);
  }

  async function togglePublished(row: FaqRow) {
    const published = !row.published;
    await fetch(`/api/admin/faq/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published } : r)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this FAQ item?")) return;
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  return (
    <AdminCard title="FAQ">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <input value={arQuestion} onChange={(e) => setArQuestion(e.target.value)} placeholder="السؤال بالعربي" dir="rtl" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm" />
        <input value={enQuestion} onChange={(e) => setEnQuestion(e.target.value)} placeholder="Question (EN)" className="min-h-10 rounded-lg border border-brand-line px-3 text-sm" />
        <textarea value={arAnswer} onChange={(e) => setArAnswer(e.target.value)} placeholder="الجواب بالعربي" dir="rtl" rows={2} className="rounded-lg border border-brand-line px-3 py-2 text-sm" />
        <textarea value={enAnswer} onChange={(e) => setEnAnswer(e.target.value)} placeholder="Answer (EN)" rows={2} className="rounded-lg border border-brand-line px-3 py-2 text-sm" />
      </div>
      <button onClick={addItem} disabled={saving} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-pink-deep hover:underline disabled:opacity-60">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add FAQ item
      </button>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className={cn("flex items-start gap-3 rounded-xl border p-3 text-xs", row.published ? "border-brand-line" : "border-brand-line bg-ivory-deep/60 opacity-70")}>
            <div className="min-w-0 grow">
              <p className="font-semibold text-brand-navy">{row.enQuestion}</p>
              <p className="mt-1 text-brand-navy-soft">{row.enAnswer}</p>
            </div>
            <button onClick={() => togglePublished(row)} className="shrink-0 text-brand-navy-soft hover:text-brand-pink-deep">
              {row.published ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button onClick={() => remove(row.id)} className="shrink-0 text-brand-navy-soft hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  area?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-brand-navy">
      {label}
      {area ? (
        <textarea value={value} dir={dir} onChange={(e) => onChange(e.target.value)} rows={2} className="rounded-lg border border-brand-line px-3 py-2 text-sm font-normal" />
      ) : (
        <input value={value} dir={dir} onChange={(e) => onChange(e.target.value)} className="min-h-10 rounded-lg border border-brand-line px-3 py-2 text-sm font-normal" />
      )}
    </label>
  );
}
