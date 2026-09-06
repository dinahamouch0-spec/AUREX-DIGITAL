"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

const PRODUCTION_STATUSES = [
  "new", "designing", "waiting_approval", "revision_requested",
  "approved", "printing", "ready", "shipped", "completed", "cancelled",
];
const PAYMENT_STATUSES = ["pending", "pending_verification", "confirmed", "cod", "failed_rejected"];

export function OrderStatusPanel({
  orderId,
  productionStatus,
  paymentStatus,
  shippingCostCents,
  productsSubtotalCents,
}: {
  orderId: string;
  productionStatus: string;
  paymentStatus: string;
  shippingCostCents: number | null;
  productsSubtotalCents: number;
}) {
  const router = useRouter();
  const [production, setProduction] = useState(productionStatus);
  const [payment, setPayment] = useState(paymentStatus);
  const [shipping, setShipping] = useState(
    shippingCostCents !== null ? (shippingCostCents / 100).toFixed(2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const finalTotal =
    shipping !== "" ? productsSubtotalCents + Math.round(parseFloat(shipping) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-xs font-semibold uppercase text-brand-navy-soft">Production Status</label>
        <select
          value={production}
          onChange={(e) => {
            setProduction(e.target.value);
            save({ productionStatus: e.target.value });
          }}
          className="mt-1 min-h-11 w-full rounded-xl border border-brand-line px-3 py-2 text-sm capitalize"
        >
          {PRODUCTION_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-brand-navy-soft">Payment Status</label>
        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            save({ paymentStatus: e.target.value });
          }}
          className="mt-1 min-h-11 w-full rounded-xl border border-brand-line px-3 py-2 text-sm capitalize"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-brand-navy-soft">Shipping Cost (USD)</label>
        <div className="mt-1 flex gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={shipping}
            placeholder="To be confirmed"
            onChange={(e) => setShipping(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-brand-line px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              save({
                shippingCostCents: shipping === "" ? null : Math.round(parseFloat(shipping) * 100),
              })
            }
            disabled={saving}
            className="min-h-11 shrink-0 rounded-xl bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-brand-navy-soft disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save"}
          </button>
        </div>
        {finalTotal !== null && (
          <p className="mt-1 text-xs text-brand-navy-soft">
            Final total: ${(finalTotal / 100).toFixed(2)}
          </p>
        )}
      </div>

      {saved && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved
        </p>
      )}
    </div>
  );
}
