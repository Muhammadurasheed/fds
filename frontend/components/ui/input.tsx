import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  helperText?: string;
  error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, label, unit, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-foreground/90 select-none"
            >
              {label}
            </label>
            {unit && (
              <span className="font-mono text-[11px] text-foreground/60 bg-surface-muted px-1.5 py-0.5 rounded border border-surface-border">
                {unit}
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-md border border-surface-border bg-surface px-3 py-1 text-sm font-mono text-foreground placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-inner",
              error && "border-scientific-error focus-visible:ring-scientific-error",
              className
            )}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="text-[11px] text-foreground/60">{helperText}</p>
        )}
        {error && (
          <p className="text-[11px] font-medium text-scientific-error">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
