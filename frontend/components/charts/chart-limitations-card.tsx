"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, BookOpen } from "lucide-react";

export function ChartLimitationsCard() {
  return (
    <Card className="border-surface-border bg-surface/90">
      <CardHeader className="pb-2.5">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/75 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          Methodological Constraints &amp; Model Interpretation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-foreground/70 leading-relaxed">
        <p>
          The curves visualised above represent continuous parametric solutions evaluated by the Python
          computational engine. Users should interpret these profiles in light of the underlying physical
          and mathematical framework:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px]">
              1. Empirical Curve Fitting
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              Calibrated against digitised laboratory core-flood data from Akinsete &amp; Isehunwa (2013)
              using non-linear least squares to estimate parameters B₁–B₅.
            </p>
          </div>

          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px]">
              2. Parameter Uncertainty Scope
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              Bootstrap percentile intervals quantify empirical parameter uncertainty of B₁–B₅ draws.
              They do not represent unconstrained reservoir field prediction intervals.
            </p>
          </div>

          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px]">
              3. Multiplicative Separability
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              Sweeps differing from the source drilling path (θ_path(t) = 20° + (10/24)·t) apply decoupled
              Gaussian correction factors, resting on the separability assumption.
            </p>
          </div>

          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px]">
              4. Mud Pressure &amp; Filtrate Scaling
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              No experimental cumulative filtrate volume Q(P) series was published in the source literature.
              Filtrate pressure dependence scales proportionally with cake thickness (Eq. 10).
            </p>
          </div>

          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px]">
              5. Calibrated Domain Boundaries
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              Operating ranges are 36–120 hr for exposure, 30–90° for inclination, and 650–4650 psi for mud pressure.
              Predictions outside these ranges represent mathematical extrapolations.
            </p>
          </div>

          <div className="p-2.5 rounded bg-surface-muted/40 border border-surface-border space-y-1">
            <span className="font-semibold text-foreground block text-[11px] flex items-center gap-1 text-amber-800">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              6. Post-100h Cake Thickness Behaviour
            </span>
            <p className="text-[11px] text-foreground/60 leading-normal">
              Published laboratory observations indicate a physical plateau or slight erosion in cake thickness
              after ~100 hr. The closed-form equation h(t) = √(B₁t - B₂e^(-B₃t)) asymptotically increases,
              representing an established mathematical formulation limitation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
