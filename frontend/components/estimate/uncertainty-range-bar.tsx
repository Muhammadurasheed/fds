"use client";

import * as React from "react";
import { PercentileInterval } from "@/lib/api";

interface UncertaintyRangeBarProps {
  label: string;
  unit: string;
  pointPrediction: number;
  interval: PercentileInterval;
  confidenceLevel: number;
}

export function UncertaintyRangeBar({
  label,
  unit,
  pointPrediction,
  interval,
  confidenceLevel,
}: UncertaintyRangeBarProps) {
  const { lower, median, upper } = interval;

  // Compute visual bounds with 10% padding
  const allVals = [pointPrediction, lower, median, upper];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const span = maxVal - minVal || 1e-4;
  const pad = span * 0.15;
  const visualMin = Math.max(0, minVal - pad);
  const visualMax = maxVal + pad;
  const visualSpan = visualMax - visualMin || 1;

  const toPct = (v: number) => {
    const clamped = Math.max(visualMin, Math.min(visualMax, v));
    return ((clamped - visualMin) / visualSpan) * 100;
  };

  const lowerPct = toPct(lower);
  const upperPct = toPct(upper);
  const medianPct = toPct(median);
  const pointPct = toPct(pointPrediction);
  const bandWidth = Math.max(upperPct - lowerPct, 2);

  // Format helper
  const fmt = (v: number) => {
    return unit === "cm" ? v.toFixed(4) : v.toFixed(2);
  };

  return (
    <div className="space-y-2 p-3 rounded-lg bg-surface-muted/50 border border-surface-border">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-[11px] font-mono text-foreground/60">
          {confidenceLevel}% Bootstrap CI
        </span>
      </div>

      {/* Visual Bar Container */}
      <div className="relative h-7 w-full bg-slate-100 rounded border border-surface-border my-2 overflow-hidden flex items-center">
        {/* Shaded Confidence Interval Range */}
        <div
          className="absolute h-4 bg-sky-200/80 rounded"
          style={{
            left: `${lowerPct}%`,
            width: `${bandWidth}%`,
          }}
          title={`Confidence Range: ${fmt(lower)} to ${fmt(upper)} ${unit}`}
        />

        {/* Median Marker (Dashed vertical line) */}
        <div
          className="absolute h-5 w-0.5 bg-sky-700 z-10 -ml-[1px]"
          style={{ left: `${medianPct}%` }}
          title={`Bootstrap Median: ${fmt(median)} ${unit}`}
        />

        {/* Point Prediction Marker (Solid diamond/dot) */}
        <div
          className="absolute h-3 w-3 bg-primary rounded-full z-20 -ml-1.5 shadow-sm border border-white"
          style={{ left: `${pointPct}%` }}
          title={`Point Prediction: ${fmt(pointPrediction)} ${unit}`}
        />
      </div>

      {/* Legend & Exact Numerical Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 border-t border-surface-border">
        <div>
          <span className="text-foreground/50 block text-[10px]">Lower ({((100 - confidenceLevel) / 2).toFixed(1)}%)</span>
          <span className="font-semibold text-foreground">{fmt(lower)} {unit}</span>
        </div>
        <div className="text-center">
          <span className="text-sky-700 font-medium block text-[10px]">Median (50%)</span>
          <span className="font-semibold text-sky-800">{fmt(median)} {unit}</span>
        </div>
        <div className="text-right">
          <span className="text-foreground/50 block text-[10px]">Upper ({(100 - (100 - confidenceLevel) / 2).toFixed(1)}%)</span>
          <span className="font-semibold text-foreground">{fmt(upper)} {unit}</span>
        </div>
      </div>
    </div>
  );
}
