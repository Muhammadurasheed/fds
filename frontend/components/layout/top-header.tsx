"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HealthStatusBadge } from "./health-status-badge";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { BookOpen } from "lucide-react";

export function TopHeader() {
  const pathname = usePathname();

  const currentItem = NAVIGATION_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <header className="hidden lg:flex items-center justify-between border-b border-surface-border bg-surface px-8 py-3.5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
          Workspace
        </span>
        <span className="text-xs text-foreground/30">&bull;</span>
        <span className="text-xs font-semibold text-foreground">
          {currentItem?.title || "Formation Damage Simulator"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/methodology"
          className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors font-medium"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Model Documentation</span>
        </Link>
      </div>
    </header>
  );
}
