import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "valid" | "warning" | "error" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-muted text-foreground/80 border-surface-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    valid: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-red-50 text-red-800 border-red-200",
    outline: "text-foreground/70 border-surface-border bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
