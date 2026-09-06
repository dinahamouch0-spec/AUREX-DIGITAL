import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-brand-line bg-white/60 px-6 py-14 text-center",
        className
      )}
    >
      {icon}
      <p className="text-lg font-semibold text-brand-navy">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-brand-navy-soft">{description}</p>
      )}
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-brand-pink/30 bg-blush px-6 py-10 text-center",
        className
      )}
    >
      <p className="text-lg font-semibold text-brand-pink-deep">{title}</p>
      {description && <p className="max-w-md text-sm text-brand-navy-soft">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center gap-3 py-14 text-brand-navy-soft", className)}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-pink border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-brand-line/60", className)}
    />
  );
}
