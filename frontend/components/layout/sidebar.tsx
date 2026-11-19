"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import {
  Compass,
  Calculator,
  LineChart,
  Database,
  BookOpen,
  Layers,
  ChevronRight,
} from "lucide-react";

const iconMap = {
  Compass,
  Calculator,
  LineChart,
  Database,
  BookOpen,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-surface-border bg-slate-900 text-slate-100 min-h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-primary-light flex items-center justify-center text-white font-bold text-sm shadow">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block group-hover:text-primary-light transition-colors">
              Formation Damage
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider block">
              SIMULATOR &bull; v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
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
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group",
                isActive
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Scientific Domain Quick Reference */}
      <div className="p-3 mx-3 mb-4 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 space-y-2">
        <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
          <span>Calibrated Domain</span>
          <span className="text-emerald-400 font-mono font-normal">Valid</span>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Time (t):</span>
            <span className="text-white">36 – 120 hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Angle (θ):</span>
            <span className="text-white">30 – 90°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pressure (P):</span>
            <span className="text-white">650 – 4650 psi</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-slate-400 leading-snug">
          Model: Akinsete &amp; Isehunwa (2013)
        </div>
      </div>
    </aside>
  );
}
