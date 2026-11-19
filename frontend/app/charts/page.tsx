"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SCIENTIFIC_DOMAIN } from "@/lib/constants";
import {
  LineChart,
  Download,
  Filter,
  Layers,
  Droplets,
  Sparkles,
  Info,
} from "lucide-react";

export default function ChartsPage() {
  const [sweepVar, setSweepVar] = React.useState<"time" | "angle" | "pressure">("time");
  const [fixedAngle, setFixedAngle] = React.useState("60.0");
  const [fixedPressure, setFixedPressure] = React.useState("2650.0");
  const [fixedTime, setFixedTime] = React.useState("96.0");
  const [calibration, setCalibration] = React.useState("experimental");
  const [includeObservations, setIncludeObservations] = React.useState(true);

  const sweepOptions = [
    { value: "time", label: "Exposure Time Sweep (36 – 120 hr)" },
    { value: "angle", label: "Deviation Angle Sweep (30 – 90°)" },
    { value: "pressure", label: "Mud Pressure Sweep (650 – 4650 psi)" },
  ];

  const calibrationOptions = SCIENTIFIC_DOMAIN.calibrations.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Parametric Sensitivity Charts"
        description="Explore 1D continuous model sweeps across exposure duration, borehole inclination, or overbalance mud pressure with overlaid experimental observations."
        badge={<Badge variant="outline">Analysis Module</Badge>}
        actions={
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Download className="w-3.5 h-3.5" /> Export Chart Data (CSV)
          </Button>
        }
      />

      {/* Sweep Configuration Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Parametric Sweep Controls
          </CardTitle>
          <CardDescription>
            Select the primary independent variable and fix baseline complementary inputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sweep Variable Selector */}
            <SelectField
              label="Sweep Variable"
              value={sweepVar}
              onChange={(e) => setSweepVar(e.target.value as any)}
              options={sweepOptions}
            />

            {/* Calibration Set */}
            <SelectField
              label="Calibration"
              value={calibration}
              onChange={(e) => setCalibration(e.target.value)}
              options={calibrationOptions}
            />

            {/* Conditional Fixed Inputs based on selected sweep */}
            {sweepVar === "time" && (
              <>
                <InputField
                  label="Fixed Deviation Angle"
                  unit="°"
                  type="number"
                  value={fixedAngle}
                  onChange={(e) => setFixedAngle(e.target.value)}
                />
                <InputField
                  label="Fixed Mud Pressure"
                  unit="psi"
                  type="number"
                  value={fixedPressure}
                  onChange={(e) => setFixedPressure(e.target.value)}
                />
              </>
            )}

            {sweepVar === "angle" && (
              <>
                <InputField
                  label="Fixed Exposure Time"
                  unit="hr"
                  type="number"
                  value={fixedTime}
                  onChange={(e) => setFixedTime(e.target.value)}
                />
                <InputField
                  label="Fixed Mud Pressure"
                  unit="psi"
                  type="number"
                  value={fixedPressure}
                  onChange={(e) => setFixedPressure(e.target.value)}
                />
              </>
            )}

            {sweepVar === "pressure" && (
              <>
                <InputField
                  label="Fixed Exposure Time"
                  unit="hr"
                  type="number"
                  value={fixedTime}
                  onChange={(e) => setFixedTime(e.target.value)}
                />
                <InputField
                  label="Fixed Deviation Angle"
                  unit="°"
                  type="number"
                  value={fixedAngle}
                  onChange={(e) => setFixedAngle(e.target.value)}
                />
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground/80">
              <input
                type="checkbox"
                checked={includeObservations}
                onChange={(e) => setIncludeObservations(e.target.checked)}
                className="rounded border-surface-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Overlay Digitised Experimental Observations (Akinsete &amp; Isehunwa 2013)</span>
            </label>

            <span className="text-[11px] font-mono text-foreground/50">
              Sweep resolution: 100 points
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1 Design Foundation Notice */}
      <Alert variant="info">
        <AlertTitle className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Parametric Visualisation Foundation — Scheduled for Phase 4
        </AlertTitle>
        <AlertDescription>
          In accordance with the project contract, Recharts dynamic vector plots will connect to the
          FastAPI sweep endpoint (`POST /api/v1/charts/sweep`) during Phase 4. No synthetic curves or
          fabricated data points are rendered ahead of backend connection.
        </AlertDescription>
      </Alert>

      {/* Visualisation Viewports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cake Thickness Chart Viewport */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Mud-Cake Thickness Response [ cm ]
              </CardTitle>
              <Badge variant="primary">h(t, θ, P)</Badge>
            </div>
            <CardDescription>
              Continuous profile over {sweepVar} showing dynamic cake deposition behaviour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 rounded border border-dashed border-surface-border bg-surface-muted/30 flex flex-col items-center justify-center p-6 text-center">
              <LineChart className="w-10 h-10 text-foreground/30 mb-2" />
              <div className="font-semibold text-xs text-foreground/70">
                Mud-Cake Thickness Chart Viewport
              </div>
              <p className="text-[11px] text-foreground/50 max-w-xs mt-1">
                Recharts responsive container ready to display model curve, 95% bootstrap confidence
                ribbon, and discrete experimental markers.
              </p>
            </div>

            {/* Scientific Observation Legend Slot */}
            <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-4 text-xs text-foreground/70">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-3 h-0.5 bg-primary rounded" />
                <span>Model Fitted Curve</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 bg-emerald-100" />
                <span>Experimental Points</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtrate Volume Chart Viewport */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Cumulative Filtrate Loss [ cc ]
              </CardTitle>
              <Badge variant="primary">Q(t, θ, P)</Badge>
            </div>
            <CardDescription>
              Leak-off accumulation across {sweepVar} domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 rounded border border-dashed border-surface-border bg-surface-muted/30 flex flex-col items-center justify-center p-6 text-center">
              <LineChart className="w-10 h-10 text-foreground/30 mb-2" />
              <div className="font-semibold text-xs text-foreground/70">
                Filtrate Volume Chart Viewport
              </div>
              <p className="text-[11px] text-foreground/50 max-w-xs mt-1">
                Recharts responsive container ready to display cumulative invasion curve and
                empirical data series.
              </p>
            </div>

            {/* Scientific Observation Legend Slot */}
            <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-4 text-xs text-foreground/70">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-3 h-0.5 bg-primary rounded" />
                <span>Model Fitted Curve</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 bg-emerald-100" />
                <span>Experimental Points</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scientific Assumption Disclosure */}
      <Alert variant="warning">
        <AlertTitle>Coupling &amp; Separability Note</AlertTitle>
        <AlertDescription>
          When sweeping angle or pressure with fixed complementary variables, values off the source
          path assume that geometric deviation and pressure effects act independently of exposure
          duration.
        </AlertDescription>
      </Alert>
    </div>
  );
}
