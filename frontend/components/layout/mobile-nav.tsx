"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { HealthStatusBadge } from "./health-status-badge";
import {
  Compass,
  Calculator,
  LineChart,
  Database,
  BookOpen,
  Layers,
  Menu,
  X,
} from "lucide-react";

const iconMap = {
  Compass,
  Calculator,
  LineChart,
  Database,
  BookOpen,
};

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Close menu on route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="lg:hidden flex items-center justify-between border-b border-surface-border bg-slate-900 px-4 py-3 text-white sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-primary-light flex items-center justify-center text-white">
          <Layers className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm tracking-tight">Formation Damage</span>
      </Link>

      <div className="flex items-center gap-2">
        <HealthStatusBadge />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[53px] bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-between p-4 bg-slate-950 animate-in fade-in duration-150 overflow-y-auto"
        >
          <nav className="space-y-1.5 pt-2">
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = iconMap[item.iconName];
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white font-semibold"
                      : "text-slate-200 hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="leading-snug">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick Domain Notice */}
          <div className="p-3 mt-6 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
            <div className="font-sans text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Calibrated Domain Bounds
            </div>
            <div>Time (t): 36 – 120 hr</div>
            <div>Angle (θ): 30 – 90°</div>
            <div>Pressure (P): 650 – 4650 psi</div>
          </div>
        </div>
      )}
    </header>
  );
}
