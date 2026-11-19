import * as React from "react";
import { cn } from "@/lib/utils";

export interface DividerProps {
  label?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  label,
  className,
  orientation = "horizontal",
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("h-full w-px bg-surface-border", className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div
        className={cn("relative my-4 flex items-center justify-center", className)}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-border" />
        </div>
        <span className="relative bg-surface px-2 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
          {label}
        </span>
      </div>
    );
  }

  return (
    <hr
      className={cn("my-4 border-t border-surface-border", className)}
      role="separator"
    />
  );
}
