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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChartViewport, ChartPoint } from "@/components/charts/chart-viewport";
import { ChartLimitationsCard } from "@/components/charts/chart-limitations-card";
import {
  api,
  ModelMetadataResponse,
  SweepResponse,
  SweepRequest,
  ApiClientError,
} from "@/lib/api";
import {
  LineChart as LineChartIcon,
  Download,
  Filter,
  Layers,
  Droplets,
  RotateCcw,
  Sparkles,
  Info,
  AlertTriangle,
  Compass,
  CheckCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Sliders,
  ShieldAlert,
} from "lucide-react";

export default function ChartsPage() {
  // Metadata & Engine Connectivity
  const [metadata, setMetadata] = React.useState<ModelMetadataResponse | null>(null);
  const [backendConnected, setBackendConnected] = React.useState<boolean | null>(null);

  // Configuration States
  const [sweepVar, setSweepVar] = React.useState<"time" | "deviation_angle" | "mud_pressure">("time");
  const [calibration, setCalibration] = React.useState<"experimental" | "model">("experimental");
  const [fixedTime, setFixedTime] = React.useState("96.0");
  const [fixedAngle, setFixedAngle] = React.useState("60.0");
  const [fixedPressure, setFixedPressure] = React.useState("2410.16");
  const [pointsCount, setPointsCount] = React.useState("100");
  const [includeObservations, setIncludeObservations] = React.useState(true);

  // Calculation & Stale tracking
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationError, setGenerationError] = React.useState<string | null>(null);
  const [sweepResponse, setSweepResponse] = React.useState<SweepResponse | null>(null);
  const [lastConfig, setLastConfig] = React.useState<{
    sweepVar: string;
    calibration: string;
    fixedTime: string;
    fixedAngle: string;
    fixedPressure: string;
  } | null>(null);

  // Load metadata on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadMetadata() {
      try {
        const data = await api.getModelMetadata();
        if (isMounted) {
          setMetadata(data);
          setBackendConnected(true);
          const exp = data.calibrations.find((c) => c.id === "experimental");
          if (exp) {
            setFixedPressure(exp.p_ref_psi.toFixed(2));
          }
        }
      } catch {
        if (isMounted) setBackendConnected(false);
      }
    }
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentCalibrationMeta = metadata?.calibrations.find((c) => c.id === calibration);
  const pRefValue = currentCalibrationMeta?.p_ref_psi || (calibration === "experimental" ? 2410.16 : 3209.35);

  const domainTime = metadata?.domain?.time_hr || { min: 36.0, max: 120.0, unit: "hr" };
  const domainAngle = metadata?.domain?.deviation_angle_deg || { min: 30.0, max: 90.0, unit: "°" };
  const domainPressure = metadata?.domain?.mud_pressure_psi || { min: 650.0, max: 4650.0, unit: "psi" };

  // Handle switching calibration: updates reference pressure
  const handleCalibrationChange = (newCalib: string) => {
    const key = newCalib as "experimental" | "model";
    setCalibration(key);
    if (metadata) {
      const target = metadata.calibrations.find((c) => c.id === key);
      if (target) {
        setFixedPressure(target.p_ref_psi.toFixed(2));
      }
    }
  };

  // Reset to initial baseline defaults
  const handleReset = () => {
    setSweepVar("time");
    setCalibration("experimental");
    setFixedTime("96.0");
    setFixedAngle("60.0");
    const defaultP = metadata?.calibrations.find((c) => c.id === "experimental")?.p_ref_psi || 2410.16;
    setFixedPressure(defaultP.toFixed(2));
    setPointsCount("100");
    setIncludeObservations(true);
    setGenerationError(null);
  };

  // Quick preset: set fixed pressure to P_ref
  const handleSetRefPressure = () => {
    setFixedPressure(pRefValue.toFixed(2));
  };

  // Client validation
  const validateInputs = (): string | null => {
    const t = parseFloat(fixedTime);
    const th = parseFloat(fixedAngle);
    const p = parseFloat(fixedPressure);

    if (sweepVar !== "time") {
      if (isNaN(t) || t <= 0) return "Fixed exposure time must be a strictly positive number.";
    }
    if (sweepVar !== "deviation_angle") {
      if (isNaN(th) || th < 0 || th > 90) return "Fixed wellbore inclination must be between 0° and 90°.";
    }
    if (sweepVar !== "mud_pressure") {
      if (isNaN(p) || p <= 0) return "Fixed mud pressure must be a strictly positive number.";
    }
    return null;
  };

  // Generate charts handler
  const handleGenerateCharts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const error = validateInputs();
    if (error) {
      setGenerationError(error);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const payload: SweepRequest = {
      sweep_variable: sweepVar,
      calibration,
      points: parseInt(pointsCount, 10) || 100,
      include_source_observations: includeObservations,
      fixed_inputs: {
        ...(sweepVar !== "time" && { time_hr: parseFloat(fixedTime) }),
        ...(sweepVar !== "deviation_angle" && { deviation_angle_deg: parseFloat(fixedAngle) }),
        ...(sweepVar !== "mud_pressure" && { mud_pressure_psi: parseFloat(fixedPressure) }),
      },
    };

    try {
      const res = await api.computeSweep(payload);
      setSweepResponse(res);
      setBackendConnected(true);
      setLastConfig({
        sweepVar,
        calibration,
        fixedTime,
        fixedAngle,
        fixedPressure,
      });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setGenerationError(err.message);
        if (err.code === "CONNECTION_ERROR") setBackendConnected(false);
      } else {
        setGenerationError("An unexpected error occurred while generating parametric curves.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically trigger initial generation on mount once metadata is ready
  React.useEffect(() => {
    if (!sweepResponse && !isGenerating && metadata) {
      handleGenerateCharts();
    }
  }, [metadata]);

  // Check if current configuration matches displayed response
  const isStale =
    lastConfig !== null &&
    (lastConfig.sweepVar !== sweepVar ||
      lastConfig.calibration !== calibration ||
      (sweepVar !== "time" && lastConfig.fixedTime !== fixedTime) ||
      (sweepVar !== "deviation_angle" && lastConfig.fixedAngle !== fixedAngle) ||
      (sweepVar !== "mud_pressure" && lastConfig.fixedPressure !== fixedPressure));

  // Transform backend response into Recharts points
  const { cakeThicknessData, filtrateVolumeData } = React.useMemo(() => {
    if (!sweepResponse) return { cakeThicknessData: [], filtrateVolumeData: [] };

    const xs = sweepResponse.x_values;
    const hs = sweepResponse.results.cake_thickness_cm;
    const qs = sweepResponse.results.filtrate_volume_cc;
    const obs = sweepResponse.source_observations;

    const hPoints: ChartPoint[] = [];
    const qPoints: ChartPoint[] = [];

    // Map 100 model curve points
    for (let i = 0; i < xs.length; i++) {
      hPoints.push({ x: xs[i], modelValue: hs[i], observedValue: null });
      qPoints.push({ x: xs[i], modelValue: qs[i], observedValue: null });
    }

    // Insert observation points if matching series exists
    if (obs.has_matching_series && obs.x_values) {
      const obsX = obs.x_values;
      const obsH = obs.cake_thickness_cm;
      const obsQ = obs.filtrate_volume_cc;

      for (let j = 0; j < obsX.length; j++) {
        const ox = obsX[j];
        if (obsH && obsH[j] !== undefined && obsH[j] !== null) {
          hPoints.push({ x: ox, modelValue: Number.NaN, observedValue: obsH[j] });
        }
        if (obsQ && obsQ[j] !== undefined && obsQ[j] !== null) {
          qPoints.push({ x: ox, modelValue: Number.NaN, observedValue: obsQ[j] });
        }
      }
    }

    // Sort by x coordinate so Recharts renders correctly
    hPoints.sort((a, b) => a.x - b.x);
    qPoints.sort((a, b) => a.x - b.x);

    return { cakeThicknessData: hPoints, filtrateVolumeData: qPoints };
  }, [sweepResponse]);

  // Export current chart series as CSV
  const handleExportCsv = () => {
    if (!sweepResponse) return;
    const xs = sweepResponse.x_values;
    const hs = sweepResponse.results.cake_thickness_cm;
    const qs = sweepResponse.results.filtrate_volume_cc;
    const xName = sweepResponse.sweep_variable;
    const xUnit = sweepResponse.x_unit;

    let csv = `${xName}_${xUnit},model_cake_thickness_cm,model_filtrate_volume_cc\n`;
    for (let i = 0; i < xs.length; i++) {
      csv += `${xs[i]},${hs[i]},${qs[i]}\n`;
    }

    const obs = sweepResponse.source_observations;
    if (obs.has_matching_series && obs.x_values) {
      csv += `\n# Matching Published Observations (${obs.series_label || "Akinsete & Isehunwa 2013"})\n`;
      csv += `${xName}_${xUnit},observed_cake_thickness_cm,observed_filtrate_volume_cc\n`;
      for (let j = 0; j < obs.x_values.length; j++) {
        const ox = obs.x_values[j];
        const oh = obs.cake_thickness_cm ? obs.cake_thickness_cm[j] : "";
        const oq = obs.filtrate_volume_cc ? obs.filtrate_volume_cc[j] : "";
        csv += `${ox},${oh ?? ""},${oq ?? ""}\n`;
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fds_sweep_${sweepResponse.sweep_variable}_${sweepResponse.metadata.calibration}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSweepVariableLabel = () => {
    if (sweepVar === "time") return { name: "Exposure Time", unit: "hr" };
    if (sweepVar === "deviation_angle") return { name: "Wellbore Inclination", unit: "°" };
    return { name: "Mud Overbalance Pressure", unit: "psi" };
  };

  const sweepMeta = getSweepVariableLabel();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Chart Explorer"
        description="Explore how drilling exposure time, wellbore inclination and mud pressure influence predicted mud-cake thickness and cumulative filtrate invasion. Adjust the operating conditions to examine the response of the selected scientific calibration."
        badge={<Badge variant="outline">Parametric Sweeps</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!sweepResponse || isGenerating}
            className="gap-2 text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Plotted Data (CSV)
          </Button>
        }
      />

      {/* Sweep Configuration Card */}
      <Card className="border-surface-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Parametric Sensitivity Controls
            </CardTitle>
            <div className="flex items-center gap-2">
              {isStale && (
                <Badge variant="warning" className="gap-1 py-0.5 text-[10px]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Configuration Modified
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-foreground/60 hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>
          </div>
          <CardDescription>
            Select the primary independent variable to sweep while holding complementary conditions fixed.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleGenerateCharts} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. Sweep Variable */}
              <SelectField
                label="Independent Sweep Variable"
                value={sweepVar}
                onChange={(e) => setSweepVar(e.target.value as any)}
                options={[
                  { value: "time", label: "Exposure Time Sweep (36 – 120 hr)" },
                  { value: "deviation_angle", label: "Deviation Angle Sweep (30 – 90°)" },
                  { value: "mud_pressure", label: "Mud Pressure Sweep (650 – 4650 psi)" },
                ]}
                helperText="Primary axis variable varying continuously along the x-axis."
              />

              {/* 2. Calibration Dataset */}
              <SelectField
                label="Calibration Dataset"
                value={calibration}
                onChange={(e) => handleCalibrationChange(e.target.value)}
                options={[
                  {
                    value: "experimental",
                    label: `Experimental Data (P_ref = ${metadata?.calibrations.find((c) => c.id === "experimental")?.p_ref_psi.toFixed(0) || "2410"} psi)`,
                  },
                  {
                    value: "model",
                    label: `Present Model Curve (P_ref = ${metadata?.calibrations.find((c) => c.id === "model")?.p_ref_psi.toFixed(0) || "3209"} psi)`,
                  },
                ]}
                helperText="Governs empirical constants B₁–B₅ and reference pressure P_ref."
              />

              {/* 3 & 4. Fixed Complementary Inputs based on Sweep Variable */}
              {sweepVar === "time" && (
                <>
                  <InputField
                    label="Fixed Deviation Angle"
                    unit="°"
                    type="number"
                    step="1"
                    min="0"
                    max="90"
                    value={fixedAngle}
                    onChange={(e) => setFixedAngle(e.target.value)}
                    helperText={`Calibrated: ${domainAngle.min} – ${domainAngle.max}° (Reference: 60°)`}
                    required
                  />
                  <div>
                    <InputField
                      label="Fixed Mud Pressure"
                      unit="psi"
                      type="number"
                      step="50"
                      value={fixedPressure}
                      onChange={(e) => setFixedPressure(e.target.value)}
                      helperText={`Calibrated: ${domainPressure.min} – ${domainPressure.max} psi (P_ref = ${pRefValue.toFixed(0)})`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSetRefPressure}
                      className="text-[10px] text-primary hover:underline font-mono mt-0.5 block"
                    >
                      Set to P_ref ({pRefValue.toFixed(0)} psi)
                    </button>
                  </div>
                </>
              )}

              {sweepVar === "deviation_angle" && (
                <>
                  <InputField
                    label="Fixed Exposure Time"
                    unit="hr"
                    type="number"
                    step="0.5"
                    value={fixedTime}
                    onChange={(e) => setFixedTime(e.target.value)}
                    helperText={`Calibrated: ${domainTime.min} – ${domainTime.max} hr (Reference: 96 hr)`}
                    required
                  />
                  <div>
                    <InputField
                      label="Fixed Mud Pressure"
                      unit="psi"
                      type="number"
                      step="50"
                      value={fixedPressure}
                      onChange={(e) => setFixedPressure(e.target.value)}
                      helperText={`Calibrated: ${domainPressure.min} – ${domainPressure.max} psi (P_ref = ${pRefValue.toFixed(0)})`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSetRefPressure}
                      className="text-[10px] text-primary hover:underline font-mono mt-0.5 block"
                    >
                      Set to P_ref ({pRefValue.toFixed(0)} psi)
                    </button>
                  </div>
                </>
              )}

              {sweepVar === "mud_pressure" && (
                <>
                  <InputField
                    label="Fixed Exposure Time"
                    unit="hr"
                    type="number"
                    step="0.5"
                    value={fixedTime}
                    onChange={(e) => setFixedTime(e.target.value)}
                    helperText={`Calibrated: ${domainTime.min} – ${domainTime.max} hr (Reference: 96 hr)`}
                    required
                  />
                  <InputField
                    label="Fixed Deviation Angle"
                    unit="°"
                    type="number"
                    step="1"
                    min="0"
                    max="90"
                    value={fixedAngle}
                    onChange={(e) => setFixedAngle(e.target.value)}
                    helperText={`Calibrated: ${domainAngle.min} – ${domainAngle.max}° (Reference: 60°)`}
                    required
                  />
                </>
              )}
            </div>

            {/* Sweep Options Bar */}
            <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground/80">
                <input
                  type="checkbox"
                  checked={includeObservations}
                  onChange={(e) => setIncludeObservations(e.target.checked)}
                  className="rounded border-surface-border text-primary focus:ring-primary h-4 w-4"
                />
                <span>Overlay Published Digitised Observations (Akinsete &amp; Isehunwa 2013)</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <span>Points:</span>
                  <select
                    value={pointsCount}
                    onChange={(e) => setPointsCount(e.target.value)}
                    className="h-8 rounded border border-surface-border bg-surface px-2 text-xs font-mono"
                  >
                    <option value="50">50 pts</option>
                    <option value="100">100 pts</option>
                    <option value="200">200 pts</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating}
                  size="sm"
                  className="gap-2 font-semibold shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Computing Sweep...
                    </>
                  ) : (
                    <>
                      <LineChartIcon className="w-3.5 h-3.5" />
                      Generate Charts
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Generation Error Banner */}
      {generationError && (
        <Alert variant="error">
          <AlertTitle className="flex items-center gap-1.5 text-red-900 font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            Chart Generation Failed
          </AlertTitle>
          <AlertDescription className="text-red-800 text-xs mt-1">
            {generationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings & Active Assumptions */}
      {sweepResponse && (
        <div className="space-y-2">
          {/* Out of Domain / Extrapolation Warning */}
          {sweepResponse.metadata.warnings.some((w) => w.includes("outside the calibrated domain")) && (
            <Alert variant="warning">
              <AlertTitle className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Domain Extrapolation Notice
              </AlertTitle>
              <AlertDescription className="text-amber-900/90 text-xs mt-0.5">
                One or more fixed parameters extend outside the calibrated experimental boundary.
                Evaluated curves represent mathematical extrapolations of the fitted model.
              </AlertDescription>
            </Alert>
          )}

          {/* Separability Warning */}
          {sweepResponse.metadata.warnings.some((w) => w.includes("separability")) && (
            <Alert variant="warning">
              <AlertTitle className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                Multiplicative Separability Active
              </AlertTitle>
              <AlertDescription className="text-amber-900/90 text-xs mt-0.5">
                {sweepResponse.metadata.warnings.find((w) => w.includes("separability"))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Charts Grid */}
      {!sweepResponse ? (
        <EmptyState
          icon={<LineChartIcon className="w-8 h-8 text-primary/60" />}
          title="Ready to Generate Curves"
          description="Select your desired sweep variable and fixed conditions, then click 'Generate Charts'."
          className="min-h-[380px] bg-surface/50 border border-dashed border-surface-border"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Mud-Cake Thickness Chart */}
            <ChartViewport
              title="Mud-Cake Thickness"
              variableSymbol="h"
              unit="cm"
              xLabel={sweepMeta.name}
              xUnit={sweepMeta.unit}
              data={cakeThicknessData}
              modelLabel={`Model Curve (${calibration === "experimental" ? "Experimental" : "Model"})`}
              observedLabel={sweepResponse.source_observations.series_label}
              hasObservations={Boolean(sweepResponse.source_observations.has_matching_series && sweepResponse.source_observations.cake_thickness_cm)}
              observationNote={sweepResponse.source_observations.has_matching_series ? sweepResponse.source_observations.note : "No matching published source series exists for these operating conditions."}
              color="#0284c7"
              description={`Predicted cake buildup across ${sweepMeta.name.toLowerCase()} domain`}
            />

            {/* 2. Cumulative Filtrate Invasion Volume Chart */}
            <ChartViewport
              title="Cumulative Filtrate Loss"
              variableSymbol="Q"
              unit="cc"
              xLabel={sweepMeta.name}
              xUnit={sweepMeta.unit}
              data={filtrateVolumeData}
              modelLabel={`Model Curve (${calibration === "experimental" ? "Experimental" : "Model"})`}
              observedLabel={sweepResponse.source_observations.series_label}
              hasObservations={Boolean(sweepResponse.source_observations.has_matching_series && sweepResponse.source_observations.filtrate_volume_cc)}
              observationNote={
                sweepVar === "mud_pressure"
                  ? "Note: No cumulative filtrate volume Q(P) series was published in the source study. Filtrate pressure scaling assumes Q ~ h in pressure (Eq. 10)."
                  : sweepResponse.source_observations.has_matching_series
                  ? sweepResponse.source_observations.note
                  : "No matching published source series exists for these operating conditions."
              }
              color="#0f766e"
              description={`Cumulative invasion volume across ${sweepMeta.name.toLowerCase()} domain`}
            />
          </div>

          {/* Scientific Limitations Card */}
          <ChartLimitationsCard />
        </div>
      )}
    </div>
  );
}
