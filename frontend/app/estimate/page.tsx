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
import { Tooltip } from "@/components/ui/tooltip";
import { UncertaintyRangeBar } from "@/components/estimate/uncertainty-range-bar";
import { DomainWarningPanel } from "@/components/estimate/domain-warning-panel";
import { PredictionSummaryCard } from "@/components/estimate/prediction-summary-card";
import {
  api,
  ModelMetadataResponse,
  PredictionResponse,
  ApiClientError,
} from "@/lib/api";
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
  CheckCircle2,
  Wifi,
  WifiOff,
  Sliders,
  ShieldAlert,
} from "lucide-react";

export default function EstimatePage() {
  // Backend metadata state
  const [metadata, setMetadata] = React.useState<ModelMetadataResponse | null>(null);
  const [metadataLoading, setMetadataLoading] = React.useState(true);
  const [backendConnected, setBackendConnected] = React.useState<boolean | null>(null);

  // Form input states
  const [time, setTime] = React.useState("96.0");
  const [angle, setAngle] = React.useState("60.0");
  const [pressure, setPressure] = React.useState("2410.16");
  const [calibration, setCalibration] = React.useState<"experimental" | "model">("experimental");
  const [includeUncertainty, setIncludeUncertainty] = React.useState(true);
  const [uncertaintyLevel, setUncertaintyLevel] = React.useState("95");

  // Client validation error messages
  const [validationErrors, setValidationErrors] = React.useState<{
    time?: string;
    angle?: string;
    pressure?: string;
    uncertainty?: string;
  }>({});

  // Calculation lifecycle states
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);
  const [errorDetails, setErrorDetails] = React.useState<{ code?: string; issues?: Array<{ loc: string[]; msg: string }> } | null>(null);
  const [predictionResponse, setPredictionResponse] = React.useState<PredictionResponse | null>(null);

  // Track the exact inputs used in the last calculation
  const [lastCalculatedInputs, setLastCalculatedInputs] = React.useState<{
    time_hr: number;
    deviation_angle_deg: number;
    mud_pressure_psi: number;
    calibration: string;
    uncertainty_level: number;
    include_uncertainty: boolean;
  } | null>(null);

  // Load model metadata on mount
  React.useEffect(() => {
    let isMounted = true;
    async function fetchMetadata() {
      try {
        setMetadataLoading(true);
        const data = await api.getModelMetadata();
        if (isMounted) {
          setMetadata(data);
          setBackendConnected(true);
          // Set initial pressure to experimental reference pressure if available
          const expCalib = data.calibrations.find((c) => c.id === "experimental");
          if (expCalib) {
            setPressure(expCalib.p_ref_psi.toFixed(2));
          }
        }
      } catch (err) {
        if (isMounted) {
          setBackendConnected(false);
          // Fallback domain bounds if backend is momentarily unreachable
        }
      } finally {
        if (isMounted) setMetadataLoading(false);
      }
    }
    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active calibration object from metadata
  const currentCalibrationMeta = metadata?.calibrations.find((c) => c.id === calibration);
  const pRefValue = currentCalibrationMeta?.p_ref_psi;

  // Domain ranges from metadata or sensible defaults
  const domainTime = metadata?.domain?.time_hr || { min: 36.0, max: 120.0, unit: "hr" };
  const domainAngle = metadata?.domain?.deviation_angle_deg || { min: 30.0, max: 90.0, unit: "°" };
  const domainPressure = metadata?.domain?.mud_pressure_psi || { min: 650.0, max: 4650.0, unit: "psi" };

  // Handle switching calibration: update pressure to new reference if desired
  const handleCalibrationChange = (newCalib: string) => {
    const calibKey = newCalib as "experimental" | "model";
    setCalibration(calibKey);

    // If metadata is present, update mud pressure to match new calibration's P_ref
    if (metadata) {
      const targetCalib = metadata.calibrations.find((c) => c.id === calibKey);
      if (targetCalib) {
        setPressure(targetCalib.p_ref_psi.toFixed(2));
      }
    }
  };

  // Reset to initial defaults
  const handleReset = () => {
    setTime("96.0");
    setAngle("60.0");
    const defaultP = metadata?.calibrations.find((c) => c.id === "experimental")?.p_ref_psi || 2410.16;
    setPressure(defaultP.toFixed(2));
    setCalibration("experimental");
    setIncludeUncertainty(true);
    setUncertaintyLevel("95");
    setValidationErrors({});
    setCalculationError(null);
    setErrorDetails(null);
  };

  // Quick preset: Snap pressure to reference pressure
  const handleSetRefPressure = () => {
    if (pRefValue) {
      setPressure(pRefValue.toFixed(2));
    }
  };

  // Client-side validation prior to backend dispatch
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    const t = parseFloat(time);
    const th = parseFloat(angle);
    const p = parseFloat(pressure);
    const lvl = parseInt(uncertaintyLevel, 10);

    if (isNaN(t) || !isFinite(t)) {
      errors.time = "Exposure time must be a finite number.";
    } else if (t <= 0) {
      errors.time = "Exposure time must be strictly positive (t > 0).";
    }

    if (isNaN(th) || !isFinite(th)) {
      errors.angle = "Deviation angle must be a finite number.";
    } else if (th < 0 || th > 90) {
      errors.angle = "Wellbore inclination must be between 0° (vertical) and 90° (horizontal).";
    }

    if (isNaN(p) || !isFinite(p)) {
      errors.pressure = "Mud pressure must be a finite number.";
    } else if (p <= 0) {
      errors.pressure = "Mud pressure must be strictly positive (P > 0).";
    }

    if (includeUncertainty) {
      if (isNaN(lvl) || lvl < 50 || lvl > 99) {
        errors.uncertainty = "Confidence level must be an integer between 50% and 99%.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit handler
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsCalculating(true);
    setCalculationError(null);
    setErrorDetails(null);

    const payload = {
      time_hr: parseFloat(time),
      deviation_angle_deg: parseFloat(angle),
      mud_pressure_psi: parseFloat(pressure),
      calibration,
      include_uncertainty: includeUncertainty,
      uncertainty_level: includeUncertainty ? parseInt(uncertaintyLevel, 10) : 95,
    };

    try {
      const response = await api.computePrediction(payload);
      setPredictionResponse(response);
      setBackendConnected(true);
      setLastCalculatedInputs({
        time_hr: payload.time_hr,
        deviation_angle_deg: payload.deviation_angle_deg,
        mud_pressure_psi: payload.mud_pressure_psi,
        calibration: payload.calibration,
        uncertainty_level: payload.uncertainty_level,
        include_uncertainty: payload.include_uncertainty,
      });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCalculationError(err.message);
        setErrorDetails({
          code: err.code,
          issues: (err.details?.issues as Array<{ loc: string[]; msg: string }>) || undefined,
        });
        if (err.code === "CONNECTION_ERROR") {
          setBackendConnected(false);
        }
      } else {
        setCalculationError("An unexpected error occurred during prediction calculation.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Dynamic theoretical drilling path angle for helper text
  const currentT = parseFloat(time);
  const inferredPathAngle = !isNaN(currentT) && currentT > 0 ? (20 + (10 / 24) * currentT).toFixed(1) : "60.0";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header with Engine Status Badge */}
      <PageHeader
        title="Formation Damage Estimator"
        description="Predict mud-cake thickness (cm) and cumulative filtrate invasion volume (cc) during drilling using empirical parameter uncertainty estimates."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="outline">Calculation Engine</Badge>
            {backendConnected === true ? (
              <Badge variant="valid" className="gap-1 text-[11px] py-0.5">
                <Wifi className="w-3 h-3" /> Engine Connected
              </Badge>
            ) : backendConnected === false ? (
              <Badge variant="error" className="gap-1 text-[11px] py-0.5">
                <WifiOff className="w-3 h-3" /> Engine Offline (127.0.0.1:8000)
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1 text-[11px] py-0.5">
                <LoadingSpinner size="sm" /> Checking...
              </Badge>
            )}
          </div>
        }
      />

      {/* Calibration context guidance banner */}
      <div className="p-3.5 rounded-lg bg-surface border border-surface-border flex items-start gap-3 text-xs text-foreground/70">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground block">
            Scientific Scope & Calibration Selection
          </span>
          <p className="leading-relaxed">
            All calculations are executed directly by the FastAPI Python scientific engine. Predictions
            rely on five recovered constants (<span className="font-mono font-medium">B₁–B₅</span>) fitted to
            Akinsete & Isehunwa (2013). Values outside calibrated ranges are evaluated with explicit extrapolation notices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleCalculate} noValidate>
            <Card className="border-surface-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    Drilling & Wellbore Parameters
                  </CardTitle>
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
                <CardDescription>
                  Configure wellbore parameters to calculate filtration damage.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 1. Exposure / Drilling Time */}
                <div>
                  <InputField
                    label="Drilling Time"
                    unit="hr"
                    type="number"
                    step="0.5"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      if (validationErrors.time) setValidationErrors((prev) => ({ ...prev, time: undefined }));
                    }}
                    error={validationErrors.time}
                    helperText={`Calibrated domain: ${domainTime.min} – ${domainTime.max} hr (physical limit: t > 0)`}
                    required
                  />
                  <span className="text-[11px] text-foreground/50 block mt-1">
                    Duration of permeable borehole exposure to overbalanced drilling fluid.
                  </span>
                </div>

                {/* 2. Wellbore Deviation Angle */}
                <div>
                  <InputField
                    label="Deviation Angle"
                    unit="°"
                    type="number"
                    step="1"
                    min="0"
                    max="90"
                    value={angle}
                    onChange={(e) => {
                      setAngle(e.target.value);
                      if (validationErrors.angle) setValidationErrors((prev) => ({ ...prev, angle: undefined }));
                    }}
                    error={validationErrors.angle}
                    helperText={`Calibrated domain: ${domainAngle.min} – ${domainAngle.max}° (0° = vertical, 90° = horizontal)`}
                    required
                  />
                  <span className="text-[11px] text-foreground/50 block mt-1">
                    Wellbore inclination angle relative to the true vertical reference.
                  </span>
                </div>

                {/* 3. Mud Pressure */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Mud Pressure</span>
                    {pRefValue && (
                      <button
                        type="button"
                        onClick={handleSetRefPressure}
                        className="text-[11px] text-primary hover:underline font-mono"
                      >
                        Set P_ref ({pRefValue.toFixed(0)} psi)
                      </button>
                    )}
                  </div>
                  <InputField
                    label=""
                    unit="psi"
                    type="number"
                    step="10"
                    value={pressure}
                    onChange={(e) => {
                      setPressure(e.target.value);
                      if (validationErrors.pressure) setValidationErrors((prev) => ({ ...prev, pressure: undefined }));
                    }}
                    error={validationErrors.pressure}
                    helperText={`Calibrated domain: ${domainPressure.min} – ${domainPressure.max} psi (reference: ${pRefValue?.toFixed(1) || "2410"} psi)`}
                    required
                  />
                  <span className="text-[11px] text-foreground/50 block mt-1">
                    Effective wellbore overbalance hydrostatic pressure.
                  </span>
                </div>

                {/* 4. Model Calibration Selection */}
                <div>
                  <SelectField
                    label="Calibration Dataset"
                    value={calibration}
                    onChange={(e) => handleCalibrationChange(e.target.value)}
                    options={[
                      {
                        value: "experimental",
                        label: `Experimental Data (P_ref = ${metadata?.calibrations.find((c) => c.id === "experimental")?.p_ref_psi.toFixed(0) || "2410"} psi)`,
                        description: "Fitted directly to physical core-flood laboratory filtration measurements.",
                      },
                      {
                        value: "model",
                        label: `Present Model Curve (P_ref = ${metadata?.calibrations.find((c) => c.id === "model")?.p_ref_psi.toFixed(0) || "3209"} psi)`,
                        description: "Fitted to source published numerical simulation curves (α = 2.0).",
                      },
                    ]}
                    helperText="Governs the B₁–B₅ parameter constants and reference calibration pressure."
                  />
                </div>

                {/* 5. Uncertainty Configuration */}
                <div className="pt-3 border-t border-surface-border space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUncertainty}
                      onChange={(e) => setIncludeUncertainty(e.target.checked)}
                      className="mt-0.5 rounded border-surface-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">
                        Include Bootstrap Parameter Uncertainty
                      </span>
                      <span className="text-[11px] text-foreground/60 block leading-tight">
                        Evaluates 300 bootstrap resamples of B₁–B₅ to calculate percentile confidence bands.
                      </span>
                    </div>
                  </label>

                  {includeUncertainty && (
                    <div className="pl-6 pt-1">
                      <SelectField
                        label="Confidence Level"
                        value={uncertaintyLevel}
                        onChange={(e) => setUncertaintyLevel(e.target.value)}
                        options={[
                          { value: "90", label: "90% Bootstrap Percentile Interval (p5 – p95)" },
                          { value: "95", label: "95% Bootstrap Percentile Interval (p2.5 – p97.5) [Recommended]" },
                          { value: "99", label: "99% Bootstrap Percentile Interval (p0.5 – p99.5)" },
                        ]}
                        error={validationErrors.uncertainty}
                        helperText="Percentile boundaries derived from empirical parameter draws."
                      />
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full gap-2 shadow-sm font-semibold"
                >
                  {isCalculating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Computing Estimation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Calculate Prediction
                    </>
                  )}
                </Button>

                {backendConnected === false && (
                  <span className="text-[11px] text-red-600 text-center block">
                    FastAPI backend appears offline. Start with <code className="font-mono bg-red-50 px-1 py-0.5 rounded">python run.py</code>.
                  </span>
                )}
              </CardFooter>
            </Card>
          </form>

          {/* Dynamic Trajectory Context Card */}
          <div className="p-3.5 rounded-lg bg-surface border border-surface-border text-xs text-foreground/70 space-y-1.5">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                Source Trajectory Alignment
              </span>
              <span className="font-mono text-[11px] text-foreground/60">
                θ_path = {inferredPathAngle}°
              </span>
            </div>
            <p className="leading-relaxed">
              At <span className="font-mono font-medium text-foreground">{time} hr</span>, the baseline source drilling
              inclination is <span className="font-mono font-semibold text-foreground">{inferredPathAngle}°</span>.
              {Math.abs(parseFloat(angle) - parseFloat(inferredPathAngle)) > 5 ? (
                <span className="text-amber-800 ml-1">
                  Your angle ({angle}°) differs by &gt;5°, activating the separability correction.
                </span>
              ) : (
                <span className="text-emerald-700 ml-1">
                  Your angle ({angle}°) aligns with the experimental source path.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Column: Results Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Error Banner (if calculation failed) */}
          {calculationError && (
            <Alert variant="error">
              <AlertTitle className="flex items-center gap-1.5 text-red-900 font-semibold">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                Calculation Failed {errorDetails?.code ? `(${errorDetails.code})` : ""}
              </AlertTitle>
              <AlertDescription className="space-y-2 mt-1">
                <p className="text-red-800 text-xs">{calculationError}</p>
                {errorDetails?.issues && errorDetails.issues.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] text-red-700 space-y-0.5">
                    {errorDetails.issues.map((iss, i) => (
                      <li key={i}>
                        <span className="font-mono">{iss.loc.join(".")}</span>: {iss.msg}
                      </li>
                    ))}
                  </ul>
                )}
                {errorDetails?.code === "CONNECTION_ERROR" && (
                  <div className="text-[11px] text-red-700/80 pt-1">
                    Ensure your backend server is running:
                    <pre className="mt-1 p-2 bg-red-100/50 rounded font-mono text-[10px]">
                      cd backend ; conda activate fds-api ; python run.py
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State before first calculation */}
          {!predictionResponse ? (
            <EmptyState
              icon={<Calculator className="w-8 h-8 text-primary/60" />}
              title="Ready for Calculation"
              description="Enter drilling parameters on the left and click 'Calculate Prediction' to evaluate the scientific model."
              className="min-h-[480px] bg-surface/50 border border-dashed border-surface-border"
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Parameter Summary Card */}
              {lastCalculatedInputs && (
                <PredictionSummaryCard
                  lastInputs={{
                    time_hr: lastCalculatedInputs.time_hr,
                    deviation_angle_deg: lastCalculatedInputs.deviation_angle_deg,
                    mud_pressure_psi: lastCalculatedInputs.mud_pressure_psi,
                  }}
                  currentInputs={{
                    time_hr: parseFloat(time) || 0,
                    deviation_angle_deg: parseFloat(angle) || 0,
                    mud_pressure_psi: parseFloat(pressure) || 0,
                  }}
                  calibration={lastCalculatedInputs.calibration}
                  calibrationName={
                    lastCalculatedInputs.calibration === "experimental"
                      ? "Experimental Data"
                      : "Present Model Curve"
                  }
                  uncertaintyEnabled={lastCalculatedInputs.include_uncertainty}
                  uncertaintyLevel={lastCalculatedInputs.uncertainty_level}
                />
              )}

              {/* Primary Results Grid (Two Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Cake Thickness (h) */}
                <Card className="border-primary/40 shadow-sm bg-gradient-to-br from-surface to-sky-50/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        Mud-Cake Thickness (h)
                      </span>
                      <Badge variant="primary" className="font-mono text-xs px-2">cm</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-mono font-bold text-primary tracking-tight">
                        {predictionResponse.results.cake_thickness_cm.toFixed(4)}
                      </span>
                      <span className="text-xs font-mono text-foreground/60">cm</span>
                    </div>
                    <span className="text-[11px] text-foreground/60 block leading-tight">
                      Best-fit point prediction from governing equation Eq. 22.
                    </span>

                    {/* Uncertainty range summary badge if enabled */}
                    {predictionResponse.uncertainty && (
                      <div className="pt-2 border-t border-surface-border text-[11px] font-mono text-foreground/75 flex justify-between">
                        <span className="text-foreground/50">95% Range:</span>
                        <span>
                          [{predictionResponse.uncertainty.cake_thickness_cm.lower.toFixed(4)} – {predictionResponse.uncertainty.cake_thickness_cm.upper.toFixed(4)}] cm
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Cumulative Filtrate Volume (Q) */}
                <Card className="border-primary/40 shadow-sm bg-gradient-to-br from-surface to-sky-50/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-sky-600" />
                        Cumulative Filtrate Volume (Q)
                      </span>
                      <Badge variant="primary" className="font-mono text-xs px-2">cc</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-mono font-bold text-sky-800 tracking-tight">
                        {predictionResponse.results.filtrate_volume_cc.toFixed(2)}
                      </span>
                      <span className="text-xs font-mono text-foreground/60">cc</span>
                    </div>
                    <span className="text-[11px] text-foreground/60 block leading-tight">
                      Cumulative fluid invasion loss into permeable core (Eq. 26).
                    </span>

                    {/* Uncertainty range summary badge if enabled */}
                    {predictionResponse.uncertainty && (
                      <div className="pt-2 border-t border-surface-border text-[11px] font-mono text-foreground/75 flex justify-between">
                        <span className="text-foreground/50">95% Range:</span>
                        <span>
                          [{predictionResponse.uncertainty.filtrate_volume_cc.lower.toFixed(2)} – {predictionResponse.uncertainty.filtrate_volume_cc.upper.toFixed(2)}] cc
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bootstrap Uncertainty Visualisation (when enabled) */}
              {predictionResponse.uncertainty && (
                <Card className="border-surface-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Bootstrap Parameter Uncertainty Analysis
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Ensemble n={predictionResponse.uncertainty.ensemble_size}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {predictionResponse.uncertainty.level}% confidence boundaries derived from parameter resamples.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Visual range bars for both outputs */}
                    <UncertaintyRangeBar
                      label="Mud-Cake Thickness (h)"
                      unit="cm"
                      pointPrediction={predictionResponse.results.cake_thickness_cm}
                      interval={predictionResponse.uncertainty.cake_thickness_cm}
                      confidenceLevel={predictionResponse.uncertainty.level}
                    />

                    <UncertaintyRangeBar
                      label="Cumulative Filtrate Volume (Q)"
                      unit="cc"
                      pointPrediction={predictionResponse.results.filtrate_volume_cc}
                      interval={predictionResponse.uncertainty.filtrate_volume_cc}
                      confidenceLevel={predictionResponse.uncertainty.level}
                    />

                    {/* Scientific notice regarding bootstrap bounds */}
                    <div className="p-2.5 rounded bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 leading-relaxed">
                      <span className="font-semibold block mb-0.5">Methodological Notice:</span>
                      {predictionResponse.uncertainty.notice}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Domain & Scientific Warnings Panel */}
              <DomainWarningPanel
                domain={predictionResponse.domain}
                timeHr={predictionResponse.inputs.time_hr}
                angleDeg={predictionResponse.inputs.deviation_angle_deg}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
