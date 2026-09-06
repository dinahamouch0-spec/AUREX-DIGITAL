"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Loader2, Clock } from "lucide-react";

type UploadStatus = "attached" | "deleted" | null;

export function OrderItemPhoto({
  orderItemId,
  status,
  deleteAfter,
}: {
  orderItemId: string;
  status: UploadStatus;
  deleteAfter: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function view() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/order-items/${orderItemId}/photo`);
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Couldn't load photo.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNow() {
    if (!confirm("Permanently delete this child's photo now? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/order-items/${orderItemId}/photo`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "deleted") {
    return <p className="text-xs italic text-brand-navy-soft">Child photo deleted per retention policy.</p>;
  }

  if (status !== "attached") {
    return <p className="text-xs text-brand-navy-soft">No photo on this item.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={view}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          View Photo
        </button>
        <button
          type="button"
          onClick={deleteNow}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-navy-soft hover:border-red-300 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete Now
        </button>
      </div>
      {deleteAfter && (
        <p className="flex items-center gap-1 text-xs text-brand-navy-soft">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Scheduled for deletion {new Date(deleteAfter).toLocaleString()}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
