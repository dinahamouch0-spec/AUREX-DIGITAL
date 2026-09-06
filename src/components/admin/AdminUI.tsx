import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-brand-line bg-white p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-brand-navy">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-brand-line bg-white p-4 transition-colors hover:border-brand-pink">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand-navy">{value}</p>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}

const PRODUCTION_COLORS: Record<string, string> = {
  new: "bg-sky-100 text-sky-800",
  designing: "bg-purple-100 text-purple-800",
  waiting_approval: "bg-amber-100 text-amber-800",
  revision_requested: "bg-orange-100 text-orange-800",
  approved: "bg-teal-100 text-teal-800",
  printing: "bg-indigo-100 text-indigo-800",
  ready: "bg-lime-100 text-lime-800",
  shipped: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  pending_verification: "bg-orange-100 text-orange-800",
  confirmed: "bg-green-100 text-green-800",
  cod: "bg-blue-100 text-blue-800",
  failed_rejected: "bg-red-100 text-red-800",
};

export function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: "production" | "payment";
}) {
  const colors = kind === "production" ? PRODUCTION_COLORS : PAYMENT_COLORS;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        colors[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-brand-navy-soft">
        {label}
      </td>
    </tr>
  );
}
