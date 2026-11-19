import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Divider } from "@/components/ui/divider";
import {
  BookOpen,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sigma,
  Scale,
} from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-200">
      <PageHeader
        title="Scientific Methodology & Model Validity"
        description="Comprehensive documentation of mathematical formulation, empirical parameter recovery, calibration datasets, and scientific boundaries based on Akinsete & Isehunwa (2013)."
        badge={<Badge variant="primary">Mathematical Basis</Badge>}
      />

      {/* 1. Core Model Formulation & Governing Equations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sigma className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">1. Governing Equations &amp; Time Formulations</CardTitle>
          </div>
          <CardDescription>
            Theoretical foundation established by Akinsete &amp; Isehunwa (2013), Petroleum Science and Technology, 31(21): 2202–2210.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            The deposition of an external filter cake and the leak-off of fluid filtrate through a
            permeable rock medium under dynamic deviated well conditions are governed by two
            coupled non-linear equations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Cake Thickness Equation */}
            <div className="p-4 rounded-lg bg-surface-muted/60 border border-surface-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Mud-Cake Thickness Equation
              </span>
              <div className="p-3 bg-surface rounded border border-surface-border text-center font-mono text-sm md:text-base font-bold text-foreground">
                h(t) = √( B₁·t − B₂·e^(−B₃·t) )
              </div>
              <p className="text-xs text-foreground/70">
                Where <code className="font-mono text-foreground font-semibold">h</code> is mud-cake
                thickness in centimeters [cm], and <code className="font-mono text-foreground font-semibold">t</code> is
                exposure time in hours [hr]. Inside the radical, values are clipped to &ge; 0 to handle times
                prior to initial cake deposition (onset time &approx; 35 hr).
              </p>
            </div>

            {/* Filtrate Volume Equation */}
            <div className="p-4 rounded-lg bg-surface-muted/60 border border-surface-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Cumulative Filtrate Loss Equation
              </span>
              <div className="p-3 bg-surface rounded border border-surface-border text-center font-mono text-sm md:text-base font-bold text-foreground">
                Q(t) = B₄·e^(−B₃·t) − B₅·t
              </div>
              <p className="text-xs text-foreground/70">
                Where <code className="font-mono text-foreground font-semibold">Q</code> is cumulative
                filtrate volume in cubic centimeters [cc], and{" "}
                <code className="font-mono text-foreground font-semibold">t</code> is exposure time in
                hours [hr].
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-foreground/70">
            <strong>Coupling Note:</strong> The kinetic coefficient{" "}
            <code className="font-mono text-foreground font-bold">B₃</code> appears in both equations,
            physically linking the rate of cake buildup to the decay in fluid invasion rate.
          </div>
        </CardContent>
      </Card>

      {/* 2. Units & Variables Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Input &amp; Output Variables Specification</CardTitle>
          <CardDescription>Standard engineering dimensions and supported intervals</CardDescription>
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
                  <th className="px-5 py-3">Physical Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-foreground/80 font-mono">
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Exposure Time</td>
                  <td className="px-5 py-2.5 font-bold">t</td>
                  <td className="px-5 py-2.5">hours [hr]</td>
                  <td className="px-5 py-2.5">36.0 – 120.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Duration formation has been exposed to drilling fluid</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Deviation Angle</td>
                  <td className="px-5 py-2.5 font-bold">θ</td>
                  <td className="px-5 py-2.5">degrees [°]</td>
                  <td className="px-5 py-2.5">30.0 – 90.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Wellbore inclination from vertical (0°=vertical, 90°=horizontal)</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 font-sans font-medium text-foreground">Mud Pressure</td>
                  <td className="px-5 py-2.5 font-bold">P</td>
                  <td className="px-5 py-2.5">pounds/sq in [psi]</td>
                  <td className="px-5 py-2.5">650.0 – 4650.0</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Effective mud hydrostatic or differential overbalance pressure</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-5 py-2.5 font-sans font-bold text-primary">Mud-Cake Thickness</td>
                  <td className="px-5 py-2.5 font-bold text-primary">h</td>
                  <td className="px-5 py-2.5 font-bold text-primary">centimeters [cm]</td>
                  <td className="px-5 py-2.5 text-foreground/60">Output</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Radial thickness of deposited low-permeability cake</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-5 py-2.5 font-sans font-bold text-primary">Filtrate Volume</td>
                  <td className="px-5 py-2.5 font-bold text-primary">Q</td>
                  <td className="px-5 py-2.5 font-bold text-primary">cubic centimeters [cc]</td>
                  <td className="px-5 py-2.5 text-foreground/60">Output</td>
                  <td className="px-5 py-2.5 font-sans text-foreground/70">Cumulative liquid volume invaded into formation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Parameter Recovery & Calibration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">3. Empirical Parameter Recovery &amp; Calibrations</CardTitle>
          </div>
          <CardDescription>
            How parameters B₁ through B₅ were recovered from digitised published figures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            The constants B₁–B₅ were not directly tabulated in numerical form in the source article.
            They were recovered by digitising high-resolution vector figures (Figures 1–5 in Akinsete &amp;
            Isehunwa 2013) using non-linear least-squares optimisation with SciPy:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded border border-surface-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Experimental Data Calibration</span>
                <Badge variant="valid">Default</Badge>
              </div>
              <p className="text-xs text-foreground/70">
                Direct non-linear curve fit to physical core-flood observations. Minimises mean squared
                error relative to measured laboratory data points. Implied reference pressure: ~2,650 psi.
              </p>
            </div>

            <div className="p-4 rounded border border-surface-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Model Curve Calibration</span>
                <Badge variant="outline">Alternative</Badge>
              </div>
              <p className="text-xs text-foreground/70">
                Fit to the published smooth model curves presented in the 2013 paper, enabling exact
                reproduction of the authors&apos; visual figures. Implied reference pressure: ~2,650 psi.
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

      {/* 4. Drilling Path & Separability Assumption */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-base">4. Inferred Drilling Path &amp; Separability Assumption</CardTitle>
          </div>
          <CardDescription>
            Essential scientific context for multi-variable extrapolation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/80">
          <p>
            In the source experimental series, time and deviation angle appear to have been varied
            together along a single continuous drilling progression. The inferred relationship is:
          </p>
          <div className="p-3 bg-surface-muted rounded border border-surface-border font-mono text-center font-bold text-foreground">
            θ_path(t) = 20 + (10 / 24) · t  [deg]
          </div>
          <p>
            Along this trajectory at reference pressure (P_ref), the model directly evaluates the
            fitted time equations. When a user requests an inclination or pressure that deviates from
            this path, the engine applies independent Gaussian angle scaling and pressure corrections.
            This relies on the <strong>separability assumption</strong>—namely, that angle and
            pressure scale formation damage independently of exposure time.
          </p>
        </CardContent>
      </Card>

      {/* 5. Scientific Limitations Table */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50/50 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <CardTitle className="text-base text-amber-900">
              5. Documented Scientific Limitations
            </CardTitle>
          </div>
          <CardDescription className="text-amber-800/80">
            These eight critical constraints must be considered when interpreting model outputs.
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
                  <td className="px-5 py-3 leading-relaxed">The source series changed time and angle concurrently, making independent physical attribution empirical rather than strictly decoupled.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">2</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Digitised Constants</td>
                  <td className="px-5 py-3 leading-relaxed">B₁–B₅ were reconstructed through digital figure extraction; numerical values depend on non-linear regression against image data.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">3</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Post-Peak Decline</td>
                  <td className="px-5 py-3 leading-relaxed">The square-root time equation cannot capture dynamic cake erosion or post-peak thickness decline observed after approximately 100 hours.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">4</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Inferred Q-P Relationship</td>
                  <td className="px-5 py-3 leading-relaxed">An independent Q-vs-pressure series was not published; filtrate pressure response is inferred proportionally from cake thickness pressure response.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">5</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Sparse Experimental Sample</td>
                  <td className="px-5 py-3 leading-relaxed">The calibration dataset comprises a limited set of discrete points; empirical parameters exhibit strong statistical covariance.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">6</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Replication vs External Validation</td>
                  <td className="px-5 py-3 leading-relaxed">Validating against source curves proves mathematical reproduction of the paper, not independent external physical verification.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">7</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Not Field-Scale Validated</td>
                  <td className="px-5 py-3 leading-relaxed">The model is an exploratory academic laboratory approximation and should not be used for primary well control or critical completions design.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono font-bold text-amber-800">8</td>
                  <td className="px-5 py-3 font-semibold text-foreground">Separability Assumption</td>
                  <td className="px-5 py-3 leading-relaxed">Calculations off the source trajectory assume independent multiplicative factors, which has not been experimentally confirmed in 3D space.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
