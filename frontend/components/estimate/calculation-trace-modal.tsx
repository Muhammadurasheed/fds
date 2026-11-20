"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalculationTrace } from "@/lib/api";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  X,
  Sigma,
  Info,
  CheckCircle2,
  AlertCircle,
  Layers,
  Droplets,
} from "lucide-react";

interface CalculationTraceModalProps {
  trace?: CalculationTrace | null;
  timeHr: number;
  angleDeg: number;
  pressurePsi: number;
  calibration: string;
  cakeThicknessCm: number;
  filtrateVolumeCc: number;
}

export function CalculationTraceModal({
  trace,
  timeHr,
  angleDeg,
  pressurePsi,
  calibration,
  cakeThicknessCm,
  filtrateVolumeCc,
}: CalculationTraceModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // If backend didn't supply trace yet, compute fallback presentation values
  const B = trace?.b_parameters || [0.002522, 0.07167, -0.005879, 8.637927, -0.259065];
  const [b1, b2, b3, b4, b5] = B;
  const pRef = trace?.p_ref_psi || (calibration === "experimental" ? 2410.16 : 3209.35);
  const thPath = trace?.theta_path_deg ?? (20 + (10 / 24) * timeHr);
  const b1t = trace?.b1_t ?? (b1 * timeHr);
  const b2Exp = trace?.b2_exp_term ?? (b2 * Math.exp(-b3 * timeHr));
  const radDiff = trace?.radical_diff ?? (b1t - b2Exp);
  const onsetClipped = trace?.onset_clipped ?? (radDiff < 0);
  const hTime = trace?.h_time_cm ?? Math.sqrt(Math.max(0, radDiff));
  const mThetaH = trace?.m_theta_h ?? 1.0;
  const mP = trace?.m_p ?? 1.0;
  const b4Exp = trace?.b4_exp_term ?? (b4 * Math.exp(-b3 * timeHr));
  const b5t = trace?.b5_t_term ?? (-b5 * timeHr);
  const qTime = trace?.q_time_cc ?? (b4Exp + b5t);
  const mThetaQ = trace?.m_theta_q ?? 1.0;

  return (
    <div className="space-y-3">
      {/* Trigger button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs gap-1.5 h-8 font-medium border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
      >
        <Calculator className="w-3.5 h-3.5" />
        {isOpen ? "Hide Calculation Trace" : "View Step-by-Step Calculation Trace"}
        {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
      </Button>

      {/* Expanded Trace Card */}
      {isOpen && (
        <Card className="border-primary/30 bg-surface shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-3 border-b border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sigma className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Step-by-Step Mathematical Trace &amp; Parameter Breakdown
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-foreground/50 hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Complete mathematical derivation of <span className="font-mono">h</span> and{" "}
              <span className="font-mono">Q</span> using recovered constants B₁–B₅ (Akinsete &amp; Isehunwa 2013).
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-5 text-xs">
            {/* 1. Active Inputs & Parameters Summary */}
            <div className="p-3 rounded-lg bg-surface-muted/60 border border-surface-border space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                1. Inputs &amp; Recovered Calibration Constants
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <span className="text-foreground/50 block text-[10px]">Time (t)</span>
                  <span className="font-bold text-foreground">{timeHr.toFixed(2)} hr</span>
                </div>
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <span className="text-foreground/50 block text-[10px]">Incline (θ)</span>
                  <span className="font-bold text-foreground">{angleDeg.toFixed(1)}°</span>
                </div>
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <span className="text-foreground/50 block text-[10px]">Pressure (P)</span>
                  <span className="font-bold text-foreground">{pressurePsi.toFixed(1)} psi</span>
                </div>
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <span className="text-foreground/50 block text-[10px]">P_ref</span>
                  <span className="font-bold text-foreground">{pRef.toFixed(1)} psi</span>
                </div>
              </div>

              {/* B1-B5 table */}
              <div className="pt-1 overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border border-surface-border rounded bg-surface">
                  <thead className="bg-surface-muted/80 text-foreground/60 text-[10px] uppercase">
                    <tr>
                      <th className="px-2.5 py-1">B₁ (growth)</th>
                      <th className="px-2.5 py-1">B₂ (delay)</th>
                      <th className="px-2.5 py-1">B₃ (kinetic)</th>
                      <th className="px-2.5 py-1">B₄ (spurt)</th>
                      <th className="px-2.5 py-1">B₅ (loss rate)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-x divide-surface-border text-foreground">
                    <tr>
                      <td className="px-2.5 py-1 font-semibold text-primary">{b1.toFixed(6)}</td>
                      <td className="px-2.5 py-1 font-semibold text-primary">{b2.toFixed(6)}</td>
                      <td className="px-2.5 py-1 font-semibold text-primary">{b3.toFixed(6)}</td>
                      <td className="px-2.5 py-1 font-semibold text-sky-700">{b4.toFixed(6)}</td>
                      <td className="px-2.5 py-1 font-semibold text-sky-700">{b5.toFixed(6)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Step-by-Step for Mud-Cake Thickness h */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>2. Derivation of Mud-Cake Thickness h(t, θ, P)</span>
              </div>
              <div className="p-3 rounded-lg border border-surface-border bg-surface-muted/30 space-y-2 font-mono text-[11px]">
                <div className="text-foreground/75 font-sans font-medium text-xs">
                  Governing Formulation:{" "}
                  <code className="text-primary font-bold">
                    h = √(max(0, B₁·t − B₂·e^(−B₃·t))) × m_θ(θ) × m_P(P)
                  </code>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-surface border border-surface-border space-y-1">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      A. Growth term (B₁·t):
                    </span>
                    <span className="font-semibold">{b1.toFixed(6)} × {timeHr.toFixed(2)} = {b1t.toFixed(6)} cm²</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-surface-border space-y-1">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      B. Delay term (B₂·e^(−B₃·t)):
                    </span>
                    <span className="font-semibold">
                      {b2.toFixed(6)} × e^({(-b3).toFixed(6)} × {timeHr.toFixed(2)}) = {b2Exp.toFixed(6)} cm²
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-surface border border-surface-border space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-sans text-[10px]">C. Radical difference (B₁·t − B₂·e^(−B₃·t)):</span>
                    <span className="font-semibold">{radDiff.toFixed(6)} cm²</span>
                  </div>
                  {onsetClipped && (
                    <span className="text-[10px] text-amber-700 block font-sans">
                      (Note: Pre-onset duration; clipped to 0 inside radical)
                    </span>
                  )}
                  <div className="flex justify-between pt-1 border-t border-surface-border">
                    <span className="text-foreground/60 font-sans text-[10px]">D. Base time cake thickness h_t(t):</span>
                    <span className="font-bold text-primary">√({Math.max(0, radDiff).toFixed(6)}) = {hTime.toFixed(5)} cm</span>
                  </div>
                </div>

                {/* Correction Multipliers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded bg-surface border border-surface-border">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      E. Angle Multiplier m_θ(θ):
                    </span>
                    <span className="font-semibold">
                      θ_path({timeHr} hr) = {thPath.toFixed(1)}° → m_θ = {mThetaH.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-surface-border">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      F. Pressure Multiplier m_P(P):
                    </span>
                    <span className="font-semibold">
                      P_ref = {pRef.toFixed(0)} psi → m_P = {mP.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Final h */}
                <div className="p-2.5 rounded bg-primary/10 border border-primary/30 flex items-center justify-between">
                  <span className="font-sans font-semibold text-foreground">
                    Final Result: h = {hTime.toFixed(5)} × {mThetaH.toFixed(4)} × {mP.toFixed(4)}
                  </span>
                  <span className="font-bold text-sm text-primary">
                    = {cakeThicknessCm.toFixed(4)} cm
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Step-by-Step for Cumulative Filtrate Volume Q */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>3. Derivation of Cumulative Filtrate Volume Q(t, θ, P)</span>
              </div>
              <div className="p-3 rounded-lg border border-surface-border bg-surface-muted/30 space-y-2 font-mono text-[11px]">
                <div className="text-foreground/75 font-sans font-medium text-xs">
                  Governing Formulation:{" "}
                  <code className="text-sky-700 font-bold">
                    Q = (B₄·e^(−B₃·t) − B₅·t) × m_θ,Q(θ) × m_P(P)
                  </code>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-surface border border-surface-border space-y-1">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      A. Spurt / early loss term (B₄·e^(−B₃·t)):
                    </span>
                    <span className="font-semibold">{b4Exp.toFixed(4)} cc</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-surface-border space-y-1">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      B. Steady-state term (−B₅·t):
                    </span>
                    <span className="font-semibold">
                      −({b5.toFixed(6)}) × {timeHr.toFixed(2)} = {b5t.toFixed(4)} cc
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-surface border border-surface-border space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-sans text-[10px]">C. Base time filtrate volume Q_t(t):</span>
                    <span className="font-bold text-sky-800">{b4Exp.toFixed(4)} + {b5t.toFixed(4)} = {qTime.toFixed(4)} cc</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded bg-surface border border-surface-border">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      D. Filtrate Angle Multiplier m_θ,Q(θ):
                    </span>
                    <span className="font-semibold">m_θ,Q = {mThetaQ.toFixed(4)}</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-surface-border">
                    <span className="text-foreground/60 block text-[10px] font-sans">
                      E. Pressure Multiplier m_P(P):
                    </span>
                    <span className="font-semibold">m_P = {mP.toFixed(4)}</span>
                  </div>
                </div>

                {/* Final Q */}
                <div className="p-2.5 rounded bg-sky-100/70 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 flex items-center justify-between">
                  <span className="font-sans font-semibold text-foreground">
                    Final Result: Q = {qTime.toFixed(4)} × {mThetaQ.toFixed(4)} × {mP.toFixed(4)}
                  </span>
                  <span className="font-bold text-sm text-sky-800 dark:text-sky-300">
                    = {filtrateVolumeCc.toFixed(2)} cc
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
