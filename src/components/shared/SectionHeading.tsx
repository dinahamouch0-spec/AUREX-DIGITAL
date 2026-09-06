import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-brand-pink-deep">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-base text-brand-navy-soft sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
