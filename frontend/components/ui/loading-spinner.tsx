import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-2 p-4", className)}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {label && <span className="text-xs text-foreground/60 font-medium">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
