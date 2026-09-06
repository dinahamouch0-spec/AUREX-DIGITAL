import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/cn";

export function CategoryFeature({
  eyebrow,
  title,
  description,
  cta,
  href,
  imageSrc,
  imageAlt,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div
            className={cn(
              "relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]",
              reverse ? "lg:order-2" : "lg:order-1"
            )}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
          <div
            className={cn(
              "flex flex-col items-start gap-4",
              reverse ? "lg:order-1" : "lg:order-2"
            )}
          >
            <span className="inline-flex items-center rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-brand-pink-deep">
              {eyebrow}
            </span>
            <h2 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">{title}</h2>
            <p className="text-base text-brand-navy-soft">{description}</p>
            <Button href={href} className="mt-2">
              {cta}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
