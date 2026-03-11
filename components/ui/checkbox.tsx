import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-5 w-5 appearance-none rounded border border-input bg-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary opacity-0 transition peer-checked:opacity-100" />
      </span>
    </label>
  );
}
