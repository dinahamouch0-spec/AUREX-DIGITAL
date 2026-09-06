"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, AlertCircle, Check, ExternalLink } from "lucide-react";
import { AdminCard } from "./AdminUI";
import { cn } from "@/lib/cn";

type FieldType = "short_text" | "long_text" | "number" | "select" | "radio" | "checkbox" | "image_upload";
type PricingRole = "none" | "quantity" | "price_override" | "price_unit" | "price_modifier";

interface OptionState {
  _localId: string;
  id?: string;
  key: string;
  sortOrder: number;
  priceOverrideCents: number | null;
  priceModifierCents: number | null;
  ar: string;
  en: string;
}

interface FieldState {
  _localId: string;
  id?: string;
  key: string;
  type: FieldType;
  required: boolean;
  active: boolean;
  sortOrder: number;
  pricingRole: PricingRole;
  defaultValue: string | null;
  ar: { label: string; helpText: string | null; placeholder: string | null };
  en: { label: string; helpText: string | null; placeholder: string | null };
  options: OptionState[];
}

interface ProductData {
  id: string;
  slug: string;
  categoryId: string;
  status: "draft" | "active" | "archived" | "unavailable";
  featured: boolean;
  pricingMode: "fixed" | "unit";
  basePriceCents: number | null;
  unitPriceCents: number | null;
  productionDays: string;
  images: { url: string; alt: string }[];
  ar: { name: string; shortDescription: string; description: string };
  en: { name: string; shortDescription: string; description: string };
  fields: {
    id?: string;
    key: string;
    type: FieldType;
    required: boolean;
    active: boolean;
    sortOrder: number;
    pricingRole: PricingRole;
    defaultValue: string | null;
    ar: { label: string; helpText: string | null; placeholder: string | null };
    en: { label: string; helpText: string | null; placeholder: string | null };
    options: {
      id?: string;
      key: string;
      sortOrder: number;
      priceOverrideCents: number | null;
      priceModifierCents: number | null;
      ar: string;
      en: string;
    }[];
  }[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function centsToDollarStr(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}
function dollarStrToCents(s: string): number | null {
  if (s.trim() === "") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function ProductEditor({
  initialData,
  categoryOptions,
}: {
  initialData: ProductData;
  categoryOptions: { id: string; label: string }[];
}) {
  const router = useRouter();

  const [slug, setSlug] = useState(initialData.slug);
  const [categoryId, setCategoryId] = useState(initialData.categoryId);
  const [status, setStatus] = useState(initialData.status);
  const [featured, setFeatured] = useState(initialData.featured);
  const [pricingMode, setPricingMode] = useState(initialData.pricingMode);
  const [basePrice, setBasePrice] = useState(centsToDollarStr(initialData.basePriceCents));
  const [unitPrice, setUnitPrice] = useState(centsToDollarStr(initialData.unitPriceCents));
  const [productionDays, setProductionDays] = useState(initialData.productionDays);
  const [images, setImages] = useState(initialData.images.map((i) => ({ ...i, _localId: uid() })));
  const [ar, setAr] = useState(initialData.ar);
  const [en, setEn] = useState(initialData.en);
  const [fields, setFields] = useState<FieldState[]>(
    initialData.fields.map((f) => ({
      ...f,
      _localId: uid(),
      options: f.options.map((o) => ({ ...o, _localId: uid() })),
    }))
  );

  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        _localId: uid(),
        key: `field_${prev.length + 1}`,
        type: "short_text",
        required: true,
        active: true,
        sortOrder: prev.length + 1,
        pricingRole: "none",
        defaultValue: null,
        ar: { label: "", helpText: "", placeholder: "" },
        en: { label: "", helpText: "", placeholder: "" },
        options: [],
      },
    ]);
  }

  function updateField(localId: string, patch: Partial<FieldState>) {
    setFields((prev) => prev.map((f) => (f._localId === localId ? { ...f, ...patch } : f)));
  }

  function removeField(localId: string) {
    setFields((prev) => prev.filter((f) => f._localId !== localId));
  }

  function moveField(localId: string, dir: -1 | 1) {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f._localId === localId);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((f, i) => ({ ...f, sortOrder: i + 1 }));
    });
  }

  function addOption(fieldLocalId: string) {
    setFields((prev) =>
      prev.map((f) =>
        f._localId === fieldLocalId
          ? {
              ...f,
              options: [
                ...f.options,
                {
                  _localId: uid(),
                  key: `option_${f.options.length + 1}`,
                  sortOrder: f.options.length + 1,
                  priceOverrideCents: null,
                  priceModifierCents: null,
                  ar: "",
                  en: "",
                },
              ],
            }
          : f
      )
    );
  }

  function updateOption(fieldLocalId: string, optionLocalId: string, patch: Partial<OptionState>) {
    setFields((prev) =>
      prev.map((f) =>
        f._localId === fieldLocalId
          ? {
              ...f,
              options: f.options.map((o) => (o._localId === optionLocalId ? { ...o, ...patch } : o)),
            }
          : f
      )
    );
  }

  function removeOption(fieldLocalId: string, optionLocalId: string) {
    setFields((prev) =>
      prev.map((f) =>
        f._localId === fieldLocalId
          ? { ...f, options: f.options.filter((o) => o._localId !== optionLocalId) }
          : f
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setIssues([]);
    setSaved(false);

    const payload = {
      slug,
      categoryId,
      status,
      featured,
      pricingMode,
      basePriceCents: dollarStrToCents(basePrice),
      unitPriceCents: dollarStrToCents(unitPrice),
      productionDays,
      images: images.map(({ url, alt }) => ({ url, alt })),
      ar,
      en,
      fields: fields.map((f) => ({
        id: f.id,
        key: f.key,
        type: f.type,
        required: f.required,
        active: f.active,
        sortOrder: f.sortOrder,
        pricingRole: f.pricingRole,
        defaultValue: f.defaultValue,
        ar: f.ar,
        en: f.en,
        options: f.options.map((o) => ({
          id: o.id,
          key: o.key,
          sortOrder: o.sortOrder,
          priceOverrideCents: o.priceOverrideCents,
          priceModifierCents: o.priceModifierCents,
          ar: o.ar,
          en: o.en,
        })),
      })),
    };

    try {
      const res = await fetch(`/api/admin/products/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const body = await res.json();
        setIssues(body.issues ?? ["Could not publish this product."]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setIssues([body.error === "SLUG_TAKEN" ? "This slug is already used by another product." : "Something went wrong."]);
        return;
      }

      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-navy">{en.name || "Product"}</h1>
        <div className="flex items-center gap-2">
          {status === "active" && (
            <>
              <a href={`/en/product/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-semibold text-brand-navy-soft hover:text-brand-pink-deep">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> EN
              </a>
              <a href={`/ar/product/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-semibold text-brand-navy-soft hover:text-brand-pink-deep">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> AR
              </a>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-11 items-center gap-2 rounded-full bg-brand-pink px-6 text-sm font-semibold text-white hover:bg-brand-pink-deep disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save
          </button>
        </div>
      </div>

      {issues.length > 0 && (
        <div role="alert" className="rounded-2xl border border-brand-pink/40 bg-blush p-4">
          <p className="mb-2 flex items-center gap-1.5 font-bold text-brand-pink-deep">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> Fix these before publishing:
          </p>
          <ul className="list-inside list-disc text-sm text-brand-navy">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
          <Check className="h-4 w-4" aria-hidden="true" /> Saved
        </p>
      )}

      <AdminCard title="Basic Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Slug" value={slug} onChange={setSlug} />
          <SelectInput label="Category" value={categoryId} onChange={setCategoryId} options={categoryOptions.map((c) => ({ value: c.id, label: c.label }))} />
          <SelectInput
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as ProductData["status"])}
            options={[
              { value: "draft", label: "Draft" },
              { value: "active", label: "Active (published)" },
              { value: "unavailable", label: "Unavailable" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <TextInput label="Production Days" value={productionDays} onChange={setProductionDays} />
          <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
            Featured on homepage
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-3 rounded-xl border border-brand-line p-3">
            <legend className="px-1 text-xs font-bold uppercase text-brand-navy-soft">Arabic</legend>
            <TextInput label="Name" value={ar.name} onChange={(v) => setAr({ ...ar, name: v })} dir="rtl" />
            <TextArea label="Short Description" value={ar.shortDescription} onChange={(v) => setAr({ ...ar, shortDescription: v })} dir="rtl" />
            <TextArea label="Description" value={ar.description} onChange={(v) => setAr({ ...ar, description: v })} dir="rtl" />
          </fieldset>
          <fieldset className="flex flex-col gap-3 rounded-xl border border-brand-line p-3">
            <legend className="px-1 text-xs font-bold uppercase text-brand-navy-soft">English</legend>
            <TextInput label="Name" value={en.name} onChange={(v) => setEn({ ...en, name: v })} />
            <TextArea label="Short Description" value={en.shortDescription} onChange={(v) => setEn({ ...en, shortDescription: v })} />
            <TextArea label="Description" value={en.description} onChange={(v) => setEn({ ...en, description: v })} />
          </fieldset>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-brand-navy">Images</p>
          <div className="flex flex-col gap-2">
            {images.map((img) => (
              <div key={img._localId} className="flex gap-2">
                <input
                  type="text"
                  value={img.url}
                  placeholder="/images/showcase/stories.png or https://..."
                  onChange={(e) =>
                    setImages((prev) => prev.map((i) => (i._localId === img._localId ? { ...i, url: e.target.value } : i)))
                  }
                  className="min-h-11 grow rounded-xl border border-brand-line px-3 py-2 text-sm"
                />
                <button
                  onClick={() => setImages((prev) => prev.filter((i) => i._localId !== img._localId))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-line text-brand-navy-soft hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setImages((prev) => [...prev, { _localId: uid(), url: "", alt: "" }])}
              className="flex items-center gap-1.5 self-start text-sm font-semibold text-brand-pink-deep hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add image
            </button>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectInput
            label="Pricing Mode"
            value={pricingMode}
            onChange={(v) => setPricingMode(v as "fixed" | "unit")}
            options={[
              { value: "fixed", label: "Fixed" },
              { value: "unit", label: "Unit (× quantity)" },
            ]}
          />
          <TextInput label="Base Price (USD)" value={basePrice} onChange={setBasePrice} placeholder="e.g. 20.00" />
          <TextInput label="Unit Price (USD)" value={unitPrice} onChange={setUnitPrice} placeholder="e.g. 2.50" />
        </div>
        <p className="mt-2 text-xs text-brand-navy-soft">
          These are the defaults used when no field overrides the price. A field with pricing role
          &quot;Price Override&quot; or &quot;Price Unit&quot; below can replace these per selection.
        </p>
      </AdminCard>

      <AdminCard
        title="Customization Fields"
        action={
          <button onClick={addField} className="flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-soft">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Field
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          {fields.length === 0 && <p className="text-sm text-brand-navy-soft">No fields yet — add one above.</p>}
          {fields.map((field, i) => (
            <FieldEditor
              key={field._localId}
              field={field}
              index={i}
              total={fields.length}
              onChange={(patch) => updateField(field._localId, patch)}
              onRemove={() => removeField(field._localId)}
              onMove={(dir) => moveField(field._localId, dir)}
              onAddOption={() => addOption(field._localId)}
              onUpdateOption={(optId, patch) => updateOption(field._localId, optId, patch)}
              onRemoveOption={(optId) => removeOption(field._localId, optId)}
            />
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: {
  field: FieldState;
  index: number;
  total: number;
  onChange: (patch: Partial<FieldState>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddOption: () => void;
  onUpdateOption: (optionLocalId: string, patch: Partial<OptionState>) => void;
  onRemoveOption: (optionLocalId: string) => void;
}) {
  const needsOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <div className={cn("rounded-xl border p-4", field.active ? "border-brand-line" : "border-brand-line bg-ivory-deep/60 opacity-70")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-brand-navy-soft">Field {index + 1}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-navy-soft hover:bg-ivory-deep disabled:opacity-30">
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-navy-soft hover:bg-ivory-deep disabled:opacity-30">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-navy-soft hover:text-red-600">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextInput label="Key" value={field.key} onChange={(v) => onChange({ key: v })} />
        <SelectInput
          label="Type"
          value={field.type}
          onChange={(v) => onChange({ type: v as FieldType })}
          options={[
            { value: "short_text", label: "Short Text" },
            { value: "long_text", label: "Long Text" },
            { value: "number", label: "Number" },
            { value: "select", label: "Select" },
            { value: "radio", label: "Radio" },
            { value: "checkbox", label: "Checkbox (multi-select)" },
            { value: "image_upload", label: "Image Upload" },
          ]}
        />
        <SelectInput
          label="Pricing Role"
          value={field.pricingRole}
          onChange={(v) => onChange({ pricingRole: v as PricingRole })}
          options={[
            { value: "none", label: "None" },
            { value: "quantity", label: "Quantity (multiplies unit price)" },
            { value: "price_override", label: "Price Override (sets total)" },
            { value: "price_unit", label: "Price Unit (sets per-unit price)" },
            { value: "price_modifier", label: "Price Modifier (adds/subtracts)" },
          ]}
        />
        <TextInput label="Default Value" value={field.defaultValue ?? ""} onChange={(v) => onChange({ defaultValue: v || null })} />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm text-brand-navy">
          <input type="checkbox" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} /> Required
        </label>
        <label className="flex items-center gap-1.5 text-sm text-brand-navy">
          <input type="checkbox" checked={field.active} onChange={(e) => onChange({ active: e.target.checked })} /> Active
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-lg border border-brand-line p-2">
          <legend className="px-1 text-[10px] font-bold uppercase text-brand-navy-soft">Arabic</legend>
          <TextInput label="Label" value={field.ar.label} onChange={(v) => onChange({ ar: { ...field.ar, label: v } })} dir="rtl" />
          <TextInput label="Help Text" value={field.ar.helpText ?? ""} onChange={(v) => onChange({ ar: { ...field.ar, helpText: v } })} dir="rtl" />
          <TextInput label="Placeholder" value={field.ar.placeholder ?? ""} onChange={(v) => onChange({ ar: { ...field.ar, placeholder: v } })} dir="rtl" />
        </fieldset>
        <fieldset className="rounded-lg border border-brand-line p-2">
          <legend className="px-1 text-[10px] font-bold uppercase text-brand-navy-soft">English</legend>
          <TextInput label="Label" value={field.en.label} onChange={(v) => onChange({ en: { ...field.en, label: v } })} />
          <TextInput label="Help Text" value={field.en.helpText ?? ""} onChange={(v) => onChange({ en: { ...field.en, helpText: v } })} />
          <TextInput label="Placeholder" value={field.en.placeholder ?? ""} onChange={(v) => onChange({ en: { ...field.en, placeholder: v } })} />
        </fieldset>
      </div>

      {needsOptions && (
        <div className="mt-3 rounded-lg bg-ivory-deep/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-brand-navy-soft">Options</p>
            <button onClick={onAddOption} className="flex items-center gap-1 text-xs font-semibold text-brand-pink-deep hover:underline">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add option
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {field.options.map((opt) => (
              <div key={opt._localId} className="grid grid-cols-2 gap-2 rounded-lg border border-brand-line bg-white p-2 sm:grid-cols-6">
                <input value={opt.key} onChange={(e) => onUpdateOption(opt._localId, { key: e.target.value })} placeholder="key" className="min-h-9 rounded-lg border border-brand-line px-2 text-xs" />
                <input value={opt.ar} onChange={(e) => onUpdateOption(opt._localId, { ar: e.target.value })} placeholder="Arabic label" dir="rtl" className="min-h-9 rounded-lg border border-brand-line px-2 text-xs" />
                <input value={opt.en} onChange={(e) => onUpdateOption(opt._localId, { en: e.target.value })} placeholder="English label" className="min-h-9 rounded-lg border border-brand-line px-2 text-xs" />
                <input
                  value={centsToDollarStr(opt.priceOverrideCents)}
                  onChange={(e) => onUpdateOption(opt._localId, { priceOverrideCents: dollarStrToCents(e.target.value) })}
                  placeholder="price $"
                  className="min-h-9 rounded-lg border border-brand-line px-2 text-xs"
                />
                <input
                  value={centsToDollarStr(opt.priceModifierCents)}
                  onChange={(e) => onUpdateOption(opt._localId, { priceModifierCents: dollarStrToCents(e.target.value) })}
                  placeholder="modifier $"
                  className="min-h-9 rounded-lg border border-brand-line px-2 text-xs"
                />
                <button onClick={() => onRemoveOption(opt._localId)} className="flex h-9 items-center justify-center rounded-lg text-brand-navy-soft hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-brand-navy">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-brand-line px-3 py-2 text-sm font-normal text-brand-navy"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-brand-navy">
      {label}
      <textarea
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="rounded-lg border border-brand-line px-3 py-2 text-sm font-normal text-brand-navy"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-brand-navy">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-brand-line px-3 py-2 text-sm font-normal text-brand-navy"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
