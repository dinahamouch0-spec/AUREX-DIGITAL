"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { AdminCard } from "./AdminUI";

interface SettingsData {
  businessName: string;
  whatsappNumber: string;
  instagramUrl: string;
  whishNumber: string;
  businessEmail: string;
  adminNotifyEmail: string;
  productionDays: string;
  photoRetentionHours: number;
  tempUploadRetentionHours: number;
}

export function SettingsForm({ initial }: { initial: SettingsData }) {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof SettingsData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminCard title="Business Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledInput label="Business Name" value={data.businessName} onChange={(v) => field("businessName", v)} />
          <LabeledInput label="WhatsApp Number" value={data.whatsappNumber} onChange={(v) => field("whatsappNumber", v)} placeholder="e.g. 9613xxxxxxx" />
          <LabeledInput label="Instagram URL" value={data.instagramUrl} onChange={(v) => field("instagramUrl", v)} placeholder="https://instagram.com/ya7kayti" />
          <LabeledInput label="Whish Number" value={data.whishNumber} onChange={(v) => field("whishNumber", v)} />
          <LabeledInput label="Business Email" value={data.businessEmail} onChange={(v) => field("businessEmail", v)} type="email" />
          <LabeledInput label="Admin Notification Email" value={data.adminNotifyEmail} onChange={(v) => field("adminNotifyEmail", v)} type="email" />
          <LabeledInput label="Production Time (days)" value={data.productionDays} onChange={(v) => field("productionDays", v)} placeholder="2-5" />
        </div>
      </AdminCard>

      <AdminCard title="Child Photo Retention">
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledInput
            label="Delete photo N hours after order completed"
            value={String(data.photoRetentionHours)}
            onChange={(v) => setData((prev) => ({ ...prev, photoRetentionHours: Number(v) || 24 }))}
            type="number"
          />
          <LabeledInput
            label="Delete abandoned uploads after N hours"
            value={String(data.tempUploadRetentionHours)}
            onChange={(v) => setData((prev) => ({ ...prev, tempUploadRetentionHours: Number(v) || 48 }))}
            type="number"
          />
        </div>
      </AdminCard>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex min-h-11 items-center gap-2 rounded-full bg-brand-pink px-6 text-sm font-semibold text-white hover:bg-brand-pink-deep disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save Settings
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" aria-hidden="true" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-brand-navy">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-brand-line px-3 py-2 text-sm font-normal text-brand-navy"
      />
    </label>
  );
}
