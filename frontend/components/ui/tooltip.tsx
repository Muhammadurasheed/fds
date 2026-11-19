"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

export interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center text-foreground/40 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-0.5"
        aria-label="More information"
        tabIndex={0}
      >
        {children || <HelpCircle className="w-3.5 h-3.5" />}
      </button>

      {isVisible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded border border-surface-border bg-slate-900 px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-md transition-opacity pointer-events-none"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
