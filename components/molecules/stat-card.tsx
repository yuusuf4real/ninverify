import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border/60 bg-white/80 px-5 py-4 shadow-sm",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
