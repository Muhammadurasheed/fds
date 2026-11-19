"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SCIENTIFIC_DOMAIN } from "@/lib/constants";
import {
  Calculator,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Droplets,
  AlertTriangle,
  Compass,
} from "lucide-react";

export default function EstimatePage() {
  // Input states (prefilled with representative reference drilling conditions)
  const [time, setTime] = React.useState("96.0");
  const [angle, setAngle] = React.useState("60.0");
  const [pressure, setPressure] = React.useState("2650.0");
  const [calibration, setCalibration] = React.useState("experimental");
  const [includeUncertainty, setIncludeUncertainty] = React.useState(true);

  // In Phase 1, calculation is not yet wired to FastAPI
  const [calculated, setCalculated] = React.useState(false);

  const calibrationOptions = SCIENTIFIC_DOMAIN.calibrations.map((c) => ({
    value: c.id,
    label: c.name,
    description: c.description,
  }));

  const handleReset = () => {
    setTime("96.0");
    setAngle("60.0");
    setPressure("2650.0");
    setCalibration("experimental");
    setCalculated(false);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculated(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Single-Point Formation Damage Estimate"
        description="Calculate mud-cake thickness (cm) and filtrate invasion volume (cc) for a specific drilling condition with optional bootstrap uncertainty intervals."
        badge={<Badge variant="outline">Calculation Module</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleCalculate}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    Drilling Conditions
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 text-xs text-foreground/60"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
                <CardDescription>
                  Enter parameters within the calibrated experimental domain.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Exposure Time */}
                <InputField
                  label={SCIENTIFIC_DOMAIN.time.label}
                  unit={SCIENTIFIC_DOMAIN.time.unit}
                  type="number"
                  step="0.5"
                  min={SCIENTIFIC_DOMAIN.time.min}
                  max={SCIENTIFIC_DOMAIN.time.max}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  helperText={`Calibrated domain: ${SCIENTIFIC_DOMAIN.time.min} – ${SCIENTIFIC_DOMAIN.time.max} hr`}
                  required
                />

                {/* Deviation Angle */}
                <InputField
                  label={SCIENTIFIC_DOMAIN.angle.label}
                  unit={SCIENTIFIC_DOMAIN.angle.unit}
                  type="number"
                  step="1"
                  min={SCIENTIFIC_DOMAIN.angle.min}
                  max={SCIENTIFIC_DOMAIN.angle.max}
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  helperText={`Calibrated domain: ${SCIENTIFIC_DOMAIN.angle.min} – ${SCIENTIFIC_DOMAIN.angle.max}° (90° = Horizontal)`}
                  required
                />

                {/* Mud Pressure */}
                <InputField
                  label={SCIENTIFIC_DOMAIN.pressure.label}
                  unit={SCIENTIFIC_DOMAIN.pressure.unit}
                  type="number"
                  step="50"
                  min={SCIENTIFIC_DOMAIN.pressure.min}
                  max={SCIENTIFIC_DOMAIN.pressure.max}
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  helperText={`Calibrated domain: ${SCIENTIFIC_DOMAIN.pressure.min} – ${SCIENTIFIC_DOMAIN.pressure.max} psi`}
                  required
                />

                {/* Calibration Set */}
                <SelectField
                  label="Model Calibration"
                  value={calibration}
                  onChange={(e) => setCalibration(e.target.value)}
                  options={calibrationOptions}
                  helperText="Select calibration constants: experimental physical data vs published model curve."
                />

                {/* Uncertainty Toggle */}
                <div className="pt-2 border-t border-surface-border">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUncertainty}
                      onChange={(e) => setIncludeUncertainty(e.target.checked)}
                      className="mt-0.5 rounded border-surface-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">
                        Compute 95% Bootstrap Uncertainty Band
                      </span>
                      <span className="text-[11px] text-foreground/60 block leading-tight">
                        Evaluates 1,000 bootstrap resamples of empirical parameters B₁–B₅.
                      </span>
                    </div>
                  </label>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button type="submit" className="w-full gap-2">
                  <Play className="w-4 h-4 fill-current" /> Compute Estimate
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Calibrated Domain Context Callout */}
          <div className="p-3.5 rounded-lg bg-surface border border-surface-border text-xs text-foreground/70 space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" />
              Inferred Source Drilling Path
            </div>
            <p className="leading-relaxed">
              At <span className="font-mono">{time} hr</span>, the baseline source drilling
              inclination is{" "}
              <span className="font-mono font-semibold text-foreground">
                {(20 + (10 / 24) * (parseFloat(time) || 96)).toFixed(1)}°
              </span>
              . If your selected angle differs by &gt;5°, the model applies a
              Gaussian separability correction.
            </p>
          </div>
        </div>

        {/* Right Column: Results & Visualisation Layout (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!calculated ? (
            <EmptyState
              icon={<Calculator className="w-6 h-6 text-primary" />}
              title="Awaiting Calculation"
              description="Adjust drilling parameters on the left and click 'Compute Estimate' to run the calculation engine."
              className="min-h-[460px]"
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Development Placeholder Notice */}
              <Alert variant="info">
                <AlertTitle className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Phase 1 Design Preview — Live Integration Scheduled for Phase 3
                </AlertTitle>
                <AlertDescription>
                  This layout demonstrates the result presentation structure. In accordance with
                  the project blueprint, no fabricated scientific results are displayed. The
                  FastAPI scientific engine endpoint (`POST /api/v1/predictions`) will populate
                  these metrics in Phase 3.
                </AlertDescription>
              </Alert>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cake Thickness Card */}
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/70">
                        Mud-Cake Thickness (h)
                      </span>
                      <Badge variant="primary">cm</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-mono font-bold text-primary tracking-tight">
                        --.--
                      </div>
                      <span className="text-xs font-mono text-foreground/60">cm</span>
                    </div>

                    {/* Uncertainty Band Slot */}
                    <div className="pt-2 border-t border-surface-border text-[11px] text-foreground/70 space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-foreground/50">95% CI Lower:</span>
                        <span>--.-- cm</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-foreground/50">95% CI Upper:</span>
                        <span>--.-- cm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Filtrate Volume Card */}
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/70">
                        Filtrate Volume (Q)
                      </span>
                      <Badge variant="primary">cc</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-mono font-bold text-primary tracking-tight">
                        --.--
                      </div>
                      <span className="text-xs font-mono text-foreground/60">cc</span>
                    </div>

                    {/* Uncertainty Band Slot */}
                    <div className="pt-2 border-t border-surface-border text-[11px] text-foreground/70 space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-foreground/50">95% CI Lower:</span>
                        <span>--.-- cc</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-foreground/50">95% CI Upper:</span>
                        <span>--.-- cc</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scientific Warnings Slot */}
              <div className="space-y-2">
                <Alert variant="warning">
                  <AlertTitle className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Separability Assumption Active
                  </AlertTitle>
                  <AlertDescription>
                    Condition ({time} hr, {angle}°, {pressure} psi) deviates from the source
                    experimental drilling trajectory. Estimations rely on decoupled Gaussian
                    angle scaling.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Contextual Visualisation Container Slot */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Predicted Point in Drilling Trajectory Space
                  </CardTitle>
                  <CardDescription>
                    Graphical representation of current estimate relative to experimental data bounds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 rounded border border-dashed border-surface-border bg-surface-muted/40 flex flex-col items-center justify-center p-4 text-center">
                    <Layers className="w-8 h-8 text-foreground/30 mb-2" />
                    <span className="text-xs font-medium text-foreground/60">
                      Contextual Trajectory Chart Slot
                    </span>
                    <span className="text-[11px] text-foreground/40 mt-1 max-w-sm">
                      Recharts dynamic point visualisation container (ready for Phase 3 integration).
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
