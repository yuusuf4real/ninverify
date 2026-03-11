import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base text-muted-foreground mx-auto">{description}</p>
      ) : null}
    </div>
  );
}
