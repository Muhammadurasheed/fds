import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface Option {
  value: string;
  label: string;
  description?: string;
}

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Option[];
}

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(({ className, label, helperText, error, options, id, ...props }, ref) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-foreground/90 select-none block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-1 pr-8 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer",
            error && "border-scientific-error focus-visible:ring-scientific-error",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-foreground/50" />
      </div>
      {helperText && !error && (
        <p className="text-[11px] text-foreground/60">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-scientific-error">{error}</p>
      )}
    </div>
  );
});

SelectField.displayName = "SelectField";
