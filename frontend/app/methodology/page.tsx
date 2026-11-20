"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api, ValidationResponse } from "@/lib/api";
import {
  Sigma,
  Scale,
  AlertTriangle,
  Layers,
  Droplets,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Compass,
  CheckCircle2,
} from "lucide-react";

export default function MethodologyPage() {
  const [validationData, setValidationData] = React.useState<ValidationResponse | null>(null);
  const [loadingValidation, setLoadingValidation] = React.useState(true);

  React.useEffect(() => {
    api
      .getModelValidation()
      .then((data) => setValidationData(data))
      .catch((err) => console.warn("Could not load validation data:", err))
      .finally(() => setLoadingValidation(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-200">
      <PageHeader
        title="Scientific Methodology & Model Validity"
        description="Comprehensive technical documentation of mathematical formulation, empirical parameter recovery, calibration datasets, and scientific boundaries based on Akinsete & Isehunwa (2013)."
        badge={<Badge variant="primary">Mathematical Basis</Badge>}
      />

      {/* Quick Navigation Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        <a href="#governing-equations" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          1. Governing Equations
        </a>
        <a href="#variables-units" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          2. Variables &amp; Units
        </a>
        <a href="#parameter-recovery" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          3. Parameter Recovery
        </a>
        <a href="#angle-pressure-corrections" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          4. Angle &amp; Pressure Corrections
        </a>
        <a href="#bootstrap-uncertainty" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          5. Bootstrap Uncertainty
        </a>
        <a href="#validation-reproduction" className="px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-primary/50 text-foreground/80 hover:text-foreground">
          6. Validation Metrics
        </a>
        <a href="#scientific-limitations" className="px-3 py-1.5 rounded-full bg-surface border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-50">
          7. Limitations (8 Key Points)
        </a>
      </div>

      {/* 1. Core Model Formulation & Governing Equations */}
      <Card id="governing-equations">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sigma className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">1. Governing Equations &amp; Physical Meaning</CardTitle>
          </div>
          <CardDescription>
            Theoretical foundation established by Akinsete &amp; Isehunwa (2013), Petroleum Science and Technology, 31(21): 2202–2210.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            During drilling operations across permeable sandstone formations, overbalance mud pressure causes
            drilling fluid filtrate to invade the formation pores while suspended mud solids deposit an external
            filter cake on the wellbore wall. This process is governed by two coupled non-linear equations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Cake Thickness Equation */}
            <div className="p-4 rounded-lg bg-surface-muted/60 border border-surface-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Mud-Cake Thickness Equation (Eq. 22)
              </span>
              <div className="p-3 bg-surface rounded border border-surface-border text-center font-mono text-sm md:text-base font-bold text-foreground">
                h(t) = √( max(0, B₁·t − B₂·e^(−B₃·t)) )
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Where <code className="font-mono text-foreground font-semibold">h</code> is mud-cake thickness in centimeters [cm],
                and <code className="font-mono text-foreground font-semibold">t</code> is exposure duration in hours [hr].
                Inside the radical, values are clipped to &ge; 0 to physically reflect the pre-deposition incubation delay (t &lt; ~35 hr).
              </p>
            </div>

            {/* Filtrate Volume Equation */}
            <div className="p-4 rounded-lg bg-surface-muted/60 border border-surface-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" /> Cumulative Filtrate Invasion Loss (Eq. 26)
              </span>
              <div className="p-3 bg-surface rounded border border-surface-border text-center font-mono text-sm md:text-base font-bold text-foreground">
                Q(t) = B₄·e^(−B₃·t) − B₅·t
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Where <code className="font-mono text-foreground font-semibold">Q</code> is cumulative filtrate volume in cubic centimeters [cc].
                The first term captures early spurt and transient leak-off; the second linear term accounts for steady-state filtration through the mature cake.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/80 leading-relaxed">
            <strong>Kinetics Coupling:</strong> The kinetic coefficient{" "}
            <code className="font-mono text-foreground font-bold">B₃</code> appears identically in both equations,
            enforcing the physical law that the rate of low-permeability cake deposition directly regulates the decay of fluid leak-off rate into the reservoir matrix.
          </div>
        </CardContent>
      </Card>

      {/* 2. Units & Variables Table */}
      <Card id="variables-units">
        <CardHeader>
          <CardTitle className="text-base">2. Input &amp; Output Variables Specification</CardTitle>
          <CardDescription>Engineering units, symbols, calibrated parameter intervals, and reservoir significance</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-surface-muted text-foreground/70 uppercase text-[10px] font-mono border-y border-surface-border">
                <tr>
                  <th className="px-5 py-3">Variable</th>
                  <th className="px-5 py-3">Symbol</th>
                  <th className="px-5 py-3">Standard Unit</th>
                  <th className="px-5 py-3">Calibrated Domain</th>
                  <th className="px-5 py-3">Petroleum Engineering Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-foreground/80 font-mono">
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Exposure Time</td>
                  <td className="px-5 py-2.5 font-bold">t</td>
                  <td className="px-5 py-2.5">hours [hr]</td>
                  <td className="px-5 py-2.5">36.0 – 120.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Filtration duration under dynamic borehole contact with drilling mud</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Deviation Angle</td>
                  <td className="px-5 py-2.5 font-bold">θ</td>
                  <td className="px-5 py-2.5">degrees [°]</td>
                  <td className="px-5 py-2.5">30.0 – 90.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Wellbore inclination from vertical (0° = vertical, 90° = horizontal)</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Mud Pressure</td>
                  <td className="px-5 py-2.5 font-bold">P</td>
                  <td className="px-5 py-2.5">pounds/sq in [psi]</td>
                  <td className="px-5 py-2.5">650.0 – 4650.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Hydrostatic or differential overbalance driving force across formation</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-5 py-2.5 font-sans font-bold text-primary">Mud-Cake Thickness</td>
                  <td className="px-5 py-2.5 font-bold text-primary">h</td>
                  <td className="px-5 py-2.5 font-bold text-primary">centimeters [cm]</td>
                  <td className="px-5 py-2.5 text-foreground/60">Primary Output</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Deposited cake barrier; excessively thick cake (&gt;0.45 cm) risks differential pipe sticking</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-5 py-2.5 font-sans font-bold text-primary">Cumulative Filtrate Volume</td>
                  <td className="px-5 py-2.5 font-bold text-primary">Q</td>
                  <td className="px-5 py-2.5 font-bold text-primary">cubic centimeters [cc]</td>
                  <td className="px-5 py-2.5 text-foreground/60">Primary Output</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Fluid loss volume; deep invasion causes relative permeability reduction (positive skin S &gt; 0)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Parameter Recovery & Calibration */}
      <Card id="parameter-recovery">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">3. Empirical Parameter Recovery &amp; Calibrations</CardTitle>
          </div>
          <CardDescription>
            Non-linear least-squares fitting of digitised publication figures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            Because the coefficients B₁–B₅ were not directly tabulated in numerical form in Akinsete &amp; Isehunwa (2013),
            they were reconstructed by digitising high-resolution vector figures (Figures 1–5) and solving non-linear
            least-squares optimisations via SciPy:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded border border-surface-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Experimental Data Calibration</span>
                <Badge variant="valid">Default</Badge>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Direct non-linear curve fit to physical core-flood laboratory observations. Minimises mean squared
                error relative to measured laboratory data points. Implied reference pressure: ~2,410.16 psi.
              </p>
            </div>

            <div className="p-4 rounded border border-surface-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Present Model Curve Calibration</span>
                <Badge variant="outline">Alternative</Badge>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Fitted directly to the published smooth simulation curves presented in the 2013 paper, enabling exact
                reproduction of the authors&apos; published plots. Implied reference pressure: ~3,209.35 psi.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-foreground block mb-2">
              Fitted Model Constants B₁–B₅ Summary Table
            </span>
            <div className="overflow-x-auto border border-surface-border rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-surface-muted text-foreground/70 uppercase text-[10px] font-mono border-b border-surface-border">
                  <tr>
                    <th className="px-4 py-2">Constant</th>
                    <th className="px-4 py-2">Physical Dimension</th>
                    <th className="px-4 py-2">Role in Formulation</th>
                    <th className="px-4 py-2 font-mono">Experimental Fit</th>
                    <th className="px-4 py-2 font-mono">Model Curve Fit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-foreground/80">
                  <tr>
                    <td className="px-4 py-2 font-bold text-foreground">B₁</td>
                    <td className="px-4 py-2">cm² / hr</td>
                    <td className="px-4 py-2 font-sans text-foreground/70">Linear cake thickness growth rate</td>
                    <td className="px-4 py-2 text-primary font-bold">0.002522</td>
                    <td className="px-4 py-2">0.003685</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-bold text-foreground">B₂</td>
                    <td className="px-4 py-2">cm²</td>
                    <td className="px-4 py-2 font-sans text-foreground/70">Exponential delay / offset in cake growth</td>
                    <td className="px-4 py-2 text-primary font-bold">0.071670</td>
                    <td className="px-4 py-2">0.100913</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-bold text-foreground">B₃</td>
                    <td className="px-4 py-2">1 / hr (hr⁻¹)</td>
                    <td className="px-4 py-2 font-sans text-foreground/70">Shared kinetic rate coefficient (in both h &amp; Q)</td>
                    <td className="px-4 py-2 text-primary font-bold">-0.005879</td>
                    <td className="px-4 py-2">-0.009034</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-bold text-foreground">B₄</td>
                    <td className="px-4 py-2">cc</td>
                    <td className="px-4 py-2 font-sans text-foreground/70">Spurt / early-stage filtrate amplitude</td>
                    <td className="px-4 py-2 text-primary font-bold">8.637927</td>
                    <td className="px-4 py-2">7.231899</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-bold text-foreground">B₅</td>
                    <td className="px-4 py-2">cc / hr</td>
                    <td className="px-4 py-2 font-sans text-foreground/70">Steady-state long-term filtration loss rate</td>
                    <td className="px-4 py-2 text-primary font-bold">-0.259065</td>
                    <td className="px-4 py-2">-0.209739</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Angle and Pressure Corrections & Separability Assumption */}
      <Card id="angle-pressure-corrections">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">4. Deviation-Angle &amp; Mud-Pressure Multiplicative Corrections</CardTitle>
          </div>
          <CardDescription>
            Coupling baseline time equations with wellbore inclination and overbalance pressure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            In the source experimental series, time and deviation angle were varied concurrently along a single
            continuous trajectory. The inferred baseline drilling path is:
          </p>
          <div className="p-3 bg-surface-muted rounded border border-surface-border font-mono text-center font-bold text-foreground">
            θ_path(t) = 20.0 + (10.0 / 24.0) · t  [deg]
          </div>
          <p>
            To evaluate arbitrary user combinations of (t, θ, P), the computational engine evaluates relative scaling multipliers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded border border-surface-border bg-surface space-y-1">
              <span className="font-sans font-semibold text-foreground block">Cake Thickness Formulation:</span>
              <code>h(t, θ, P) = h_t(t) × [h_θ(θ) / h_θ(θ_path(t))] × [h_P(P) / h_P(P_ref)]</code>
            </div>
            <div className="p-3 rounded border border-surface-border bg-surface space-y-1">
              <span className="font-sans font-semibold text-foreground block">Filtrate Volume Formulation:</span>
              <code>Q(t, θ, P) = Q_t(t) × [Q_θ(θ) / Q_θ(θ_path(t))] × [h_P(P) / h_P(P_ref)]</code>
            </div>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Here, <code className="font-mono text-foreground font-semibold">h_θ(θ)</code> and{" "}
            <code className="font-mono text-foreground font-semibold">h_P(P)</code> are empirical Gaussian curves
            fitted by AICc/LOOCV, and <code className="font-mono text-foreground font-semibold">Q_θ(θ)</code> is a linear
            polynomial fit. Because an independent Q-vs-pressure series was not published in the source study, the filtrate
            volume pressure correction scales proportionally to the cake thickness pressure response (Eq. 10).
          </p>
        </CardContent>
      </Card>

      {/* 5. Bootstrap Parameter Uncertainty */}
      <Card id="bootstrap-uncertainty">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">5. Bootstrap Parameter Uncertainty &amp; Percentile Intervals</CardTitle>
          </div>
          <CardDescription>
            Quantifying statistical parameter covariance from non-parametric bootstrap resampling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            To evaluate parameter uncertainty, the computational engine evaluates an ensemble of{" "}
            <strong>300 bootstrap resamples</strong> of the parameter vector [B₁..B₅]. For any specified confidence
            percentile (e.g. 95%), percentile cutoffs are extracted:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
            <div className="p-2.5 rounded bg-surface border border-surface-border">
              <span className="text-[10px] text-foreground/50 block font-sans">Lower Bound (p2.5)</span>
              <span className="font-bold text-foreground">lo = (100 - level) / 2</span>
            </div>
            <div className="p-2.5 rounded bg-surface border border-surface-border">
              <span className="text-[10px] text-foreground/50 block font-sans">Median (p50)</span>
              <span className="font-bold text-foreground">50th Percentile</span>
            </div>
            <div className="p-2.5 rounded bg-surface border border-surface-border">
              <span className="text-[10px] text-foreground/50 block font-sans">Upper Bound (p97.5)</span>
              <span className="font-bold text-foreground">hi = 100 - (100 - level) / 2</span>
            </div>
          </div>
          <Alert variant="info">
            <AlertTitle className="font-semibold">Important Scientific Distinction on Uncertainty</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              These bootstrap percentile intervals quantify the empirical fitting uncertainty of the recovered coefficients B₁–B₅.
              They do <strong>not</strong> represent total field predictive uncertainty or encompass operational variations in mud composition,
              heterogeneous core permeability, or downhole thermal gradients.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 6. Validation & Mathematical Reproduction Metrics */}
      <Card id="validation-reproduction">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base">6. Mathematical Reproduction &amp; Validation Metrics</CardTitle>
          </div>
          <CardDescription>
            Live quantitative verification against digitised published data from Akinsete &amp; Isehunwa (2013)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            The table below presents the quantitative goodness-of-fit metrics obtained by comparing the computational
            engine against the digitised reference curves:
          </p>

          {loadingValidation ? (
            <div className="py-8 flex justify-center items-center gap-2 text-foreground/60">
              <LoadingSpinner size="md" /> Loading live validation metrics from backend...
            </div>
          ) : validationData ? (
            <div className="overflow-x-auto border border-surface-border rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-surface-muted text-foreground/70 uppercase text-[10px] font-mono border-b border-surface-border">
                  <tr>
                    <th className="px-4 py-2.5">Calibration Model</th>
                    <th className="px-4 py-2.5">RMSE</th>
                    <th className="px-4 py-2.5">R² Score</th>
                    <th className="px-4 py-2.5">MAE</th>
                    <th className="px-4 py-2.5">MAPE (%)</th>
                    <th className="px-4 py-2.5">Points (n)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-foreground/80">
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-semibold text-foreground">Experimental Data Fit</td>
                    <td className="px-4 py-2.5 text-primary font-bold">{validationData.experimental.RMSE.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-primary font-bold">{validationData.experimental.R2.toFixed(4)}</td>
                    <td className="px-4 py-2.5">{validationData.experimental.MAE.toFixed(4)}</td>
                    <td className="px-4 py-2.5">{validationData.experimental.MAPE.toFixed(2)}%</td>
                    <td className="px-4 py-2.5">{validationData.experimental.n}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-semibold text-foreground">Present Model Curve Fit</td>
                    <td className="px-4 py-2.5 text-sky-700 font-bold">{validationData.model.RMSE.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-sky-700 font-bold">{validationData.model.R2.toFixed(4)}</td>
                    <td className="px-4 py-2.5">{validationData.model.MAE.toFixed(4)}</td>
                    <td className="px-4 py-2.5">{validationData.model.MAPE.toFixed(2)}%</td>
                    <td className="px-4 py-2.5">{validationData.model.n}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-surface-muted rounded text-xs text-foreground/60">
              Validation endpoint currently unreachable. Ensure FastAPI backend is active.
            </div>
          )}

          <Alert variant="warning">
            <AlertTitle className="font-semibold">Academically Defensible Validation Scope</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Validation against digitised curves used to calibrate or reconstruct the model constitutes a{" "}
              <strong>mathematical reproduction and implementation check</strong>. It confirms that the Python scientific engine
              accurately reproduces the published figures in Akinsete &amp; Isehunwa (2013). It does <strong>not</strong> constitute independent external reservoir or field-scale validation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 7. Documented Scientific Limitations */}
      <Card id="scientific-limitations" className="border-amber-200">
        <CardHeader className="bg-amber-50/50 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <CardTitle className="text-base text-amber-900">
              7. Eight Documented Scientific Limitations
            </CardTitle>
          </div>
          <CardDescription className="text-amber-800/80">
            Mandatory constraints and operational assumptions that must be respected during engineering interpretation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-amber-100/60 text-amber-900 uppercase text-[10px] font-mono border-b border-amber-200">
                <tr>
                  <th className="px-5 py-2.5 w-12">#</th>
                  <th className="px-5 py-2.5 w-48">Limitation</th>
                  <th className="px-5 py-2.5">Scientific Explanation &amp; Practical Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/80 text-foreground/80">
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">1</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Confounded Time &amp; Angle</td>
                  <td className="px-5 py-3 leading-relaxed">The source experimental series changed exposure time and wellbore angle concurrently along a single drilling progression, making independent physical attribution empirical rather than strictly decoupled.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">2</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Digitised Constants</td>
                  <td className="px-5 py-3 leading-relaxed">Parameters B₁–B₅ were reconstructed through digital image curve extraction from Figures 1–5; numerical values depend on non-linear least-squares fitting against digitized coordinates.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">3</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Post-Peak Cake Decline</td>
                  <td className="px-5 py-3 leading-relaxed">The square-root time equation cannot capture dynamic mechanical cake erosion or post-peak thickness decline observed after approximately 100 hours in long-duration runs.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">4</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Inferred Q-P Relationship</td>
                  <td className="px-5 py-3 leading-relaxed">An independent Q-vs-pressure series was not published in the source study; filtrate volume response under pressure sweeps is scaled proportionally to cake thickness pressure response (Eq. 10).</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">5</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Sparse Experimental Sample</td>
                  <td className="px-5 py-3 leading-relaxed">The laboratory core dataset comprises a limited discrete set of physical measurements; fitted empirical parameters exhibit strong statistical covariance.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">6</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Replication vs External Validation</td>
                  <td className="px-5 py-3 leading-relaxed">Verifying results against the source curves demonstrates mathematical reproduction of the authors&apos; figures, not independent external physical verification across different field fluids or formations.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">7</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Not Field-Scale Validated</td>
                  <td className="px-5 py-3 leading-relaxed">The model is an exploratory academic laboratory approximation calibrated on consolidated sandstones; it is not certified for primary well control or critical production casing design.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">8</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Separability Assumption</td>
                  <td className="px-5 py-3 leading-relaxed">Calculations off the source trajectory (|θ − θ_path| &gt; 5°) assume independent multiplicative factors, which has not been experimentally confirmed in 3D multi-variable space.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model Citation & Attribution */}
      <Card className="border-surface-border bg-surface-muted/30">
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs text-foreground">Academic Citation &amp; Model Version</span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed font-mono">
            Akinsete, O. O., &amp; Isehunwa, S. O. (2013). Computational Analysis of Formation Damage in a Deviated Well.{" "}
            <em>Petroleum Science and Technology</em>, 31(21), 2202–2210. DOI: 10.1080/10916466.2011.569806
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/estimate">
              <Button size="sm" className="gap-1.5 text-xs">
                Launch Estimator <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <Link href="/charts">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Explore Parametric Charts
              </Button>
            </Link>
            <Link href="/dataset">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Generate Grid Dataset
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
