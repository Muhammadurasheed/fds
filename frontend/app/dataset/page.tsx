"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  api,
  ApiClientError,
  DatasetGenerateRequest,
  DatasetGenerateResponse,
  ModelMetadataResponse,
} from "@/lib/api";
import {
  Database,
  Download,
  Grid,
  AlertTriangle,
  Play,
  RotateCcw,
  FileSpreadsheet,
  Info,
  CheckCircle2,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_ROWS = 50_000;
const PREVIEW_ROWS = 20;

type Calibration = "experimental" | "model";

interface FormState {
  timeSteps: string;
  angleSteps: string;
  pressureSteps: string;
  timeMin: string;
  timeMax: string;
  angleMin: string;
  angleMax: string;
  pressureMin: string;
  pressureMax: string;
  calibration: Calibration;
}

const DEFAULT_FORM: FormState = {
  timeSteps: "25",
  angleSteps: "13",
  pressureSteps: "15",
  timeMin: "36.0",
  timeMax: "120.0",
  angleMin: "30.0",
  angleMax: "90.0",
  pressureMin: "650.0",
  pressureMax: "4650.0",
  calibration: "experimental",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function parsePositiveFloat(s: string): number | null {
  const v = parseFloat(s);
  return isFinite(v) && v > 0 ? v : null;
}

function parseNonNegativeFloat(s: string): number | null {
  const v = parseFloat(s);
  return isFinite(v) && v >= 0 ? v : null;
}

function parseStep(s: string, min: number, max: number): number | null {
  const v = parseInt(s, 10);
  return Number.isInteger(v) && v >= min && v <= max ? v : null;
}

function formStateToRequest(f: FormState): DatasetGenerateRequest | null {
  const tSteps = parseStep(f.timeSteps, 2, 100);
  const aSteps = parseStep(f.angleSteps, 2, 50);
  const pSteps = parseStep(f.pressureSteps, 2, 50);

  const tMin = parsePositiveFloat(f.timeMin);
  const tMax = parsePositiveFloat(f.timeMax);
  const aMin = parseNonNegativeFloat(f.angleMin);
  const aMax = parseNonNegativeFloat(f.angleMax);
  const pMin = parsePositiveFloat(f.pressureMin);
  const pMax = parsePositiveFloat(f.pressureMax);

  if (
    tSteps === null || aSteps === null || pSteps === null ||
    tMin === null || tMax === null ||
    aMin === null || aMax === null ||
    pMin === null || pMax === null
  ) return null;

  return {
    time_steps: tSteps,
    angle_steps: aSteps,
    pressure_steps: pSteps,
    time_range_hr: [tMin, tMax],
    angle_range_deg: [aMin, aMax],
    pressure_range_psi: [pMin, pMax],
    calibration: f.calibration,
    preview_rows: PREVIEW_ROWS,
  };
}

function validateForm(f: FormState): string[] {
  const errors: string[] = [];

  const tSteps = parseStep(f.timeSteps, 2, 100);
  const aSteps = parseStep(f.angleSteps, 2, 50);
  const pSteps = parseStep(f.pressureSteps, 2, 50);
  if (tSteps === null) errors.push("Time Steps must be an integer between 2 and 100.");
  if (aSteps === null) errors.push("Angle Steps must be an integer between 2 and 50.");
  if (pSteps === null) errors.push("Pressure Steps must be an integer between 2 and 50.");

  const tMin = parsePositiveFloat(f.timeMin);
  const tMax = parsePositiveFloat(f.timeMax);
  if (tMin === null) errors.push("Min Time must be a positive number.");
  if (tMax === null) errors.push("Max Time must be a positive number.");
  if (tMin !== null && tMax !== null && tMin >= tMax) errors.push("Min Time must be less than Max Time.");

  const aMin = parseNonNegativeFloat(f.angleMin);
  const aMax = parseNonNegativeFloat(f.angleMax);
  if (aMin === null || aMin < 0 || aMin > 90) errors.push("Min Angle must be between 0° and 90°.");
  if (aMax === null || aMax < 0 || aMax > 90) errors.push("Max Angle must be between 0° and 90°.");
  if (aMin !== null && aMax !== null && aMin >= aMax) errors.push("Min Angle must be less than Max Angle.");

  const pMin = parsePositiveFloat(f.pressureMin);
  const pMax = parsePositiveFloat(f.pressureMax);
  if (pMin === null) errors.push("Min Pressure must be a positive number.");
  if (pMax === null) errors.push("Max Pressure must be a positive number.");
  if (pMin !== null && pMax !== null && pMin >= pMax) errors.push("Min Pressure must be less than Max Pressure.");

  if (tSteps !== null && aSteps !== null && pSteps !== null) {
    const rows = tSteps * aSteps * pSteps;
    if (rows > MAX_ROWS) errors.push(`Grid exceeds ${MAX_ROWS.toLocaleString()}-row limit (${rows.toLocaleString()} rows requested). Reduce step counts.`);
  }

  return errors;
}

function checkDomainWarnings(
  f: FormState,
  meta: ModelMetadataResponse | null
): string[] {
  if (!meta) return [];
  const warnings: string[] = [];
  const { domain } = meta;

  const tMin = parseFloat(f.timeMin);
  const tMax = parseFloat(f.timeMax);
  const aMin = parseFloat(f.angleMin);
  const aMax = parseFloat(f.angleMax);
  const pMin = parseFloat(f.pressureMin);
  const pMax = parseFloat(f.pressureMax);

  if (isFinite(tMin) && tMin < domain.time_hr.min) warnings.push(`Min Time (${tMin} hr) is below the calibrated range (${domain.time_hr.min} hr).`);
  if (isFinite(tMax) && tMax > domain.time_hr.max) warnings.push(`Max Time (${tMax} hr) exceeds the calibrated range (${domain.time_hr.max} hr).`);
  if (isFinite(aMin) && aMin < domain.deviation_angle_deg.min) warnings.push(`Min Angle (${aMin}°) is below the calibrated range (${domain.deviation_angle_deg.min}°).`);
  if (isFinite(aMax) && aMax > domain.deviation_angle_deg.max) warnings.push(`Max Angle (${aMax}°) exceeds the calibrated range (${domain.deviation_angle_deg.max}°).`);
  if (isFinite(pMin) && pMin < domain.mud_pressure_psi.min) warnings.push(`Min Pressure (${pMin} psi) is below the calibrated range (${domain.mud_pressure_psi.min} psi).`);
  if (isFinite(pMax) && pMax > domain.mud_pressure_psi.max) warnings.push(`Max Pressure (${pMax} psi) exceeds the calibrated range (${domain.mud_pressure_psi.max} psi).`);

  return warnings;
}

function formKey(f: FormState): string {
  return JSON.stringify(f);
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DatasetPage() {
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [metadata, setMetadata] = React.useState<ModelMetadataResponse | null>(null);
  const [backendConnected, setBackendConnected] = React.useState<boolean | null>(null);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationError, setGenerationError] = React.useState<string | null>(null);
  const [datasetResponse, setDatasetResponse] = React.useState<DatasetGenerateResponse | null>(null);
  const [lastGeneratedKey, setLastGeneratedKey] = React.useState<string | null>(null);

  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  // ── load metadata ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    api
      .getModelMetadata()
      .then((m) => {
        setMetadata(m);
        setBackendConnected(true);
      })
      .catch(() => {
        setBackendConnected(false);
      });
  }, []);

  // ── derived ────────────────────────────────────────────────────────────────
  const tSteps = parseInt(form.timeSteps, 10) || 0;
  const aSteps = parseInt(form.angleSteps, 10) || 0;
  const pSteps = parseInt(form.pressureSteps, 10) || 0;
  const projectedRows = tSteps * aSteps * pSteps;
  const isOverLimit = projectedRows > MAX_ROWS;
  const currentKey = formKey(form);
  const isStale = datasetResponse !== null && lastGeneratedKey !== currentKey;
  const domainWarnings = checkDomainWarnings(form, metadata);
  const validationErrors = validateForm(form);
  const canSubmit = validationErrors.length === 0 && !isGenerating && !isExporting;

  // ── calibration display name ───────────────────────────────────────────────
  const calibrationLabel =
    form.calibration === "experimental" ? "Experimental Calibration" : "Model Calibration";

  // ── form field updater ─────────────────────────────────────────────────────
  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };
  }

  // ── handlers ───────────────────────────────────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateForm(form);
    if (errors.length > 0) return;
    const payload = formStateToRequest(form);
    if (!payload) return;

    setIsGenerating(true);
    setGenerationError(null);
    setExportError(null);

    try {
      const result = await api.generateDataset(payload);
      setDatasetResponse(result);
      setLastGeneratedKey(currentKey);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
          ? err.message
          : "An unexpected error occurred.";
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport() {
    const payload = formStateToRequest(form);
    if (!payload || !datasetResponse) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await api.exportDatasetCsv(payload);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filename = `formation_damage_dataset_${form.calibration}_${today}.csv`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Export failed.";
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setDatasetResponse(null);
    setLastGeneratedKey(null);
    setGenerationError(null);
    setExportError(null);
  }

  // ── summary stats ──────────────────────────────────────────────────────────
  const previewRows = datasetResponse?.preview ?? [];
  const hValues = previewRows.map((r) => r.cake_thickness_cm).filter(isFinite);
  const qValues = previewRows.map((r) => r.filtrate_volume_cc).filter(isFinite);
  const hMin = hValues.length ? Math.min(...hValues) : null;
  const hMax = hValues.length ? Math.max(...hValues) : null;
  const qMin = qValues.length ? Math.min(...qValues) : null;
  const qMax = qValues.length ? Math.max(...qValues) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Structured Grid Dataset Generator"
        description="Synthesise regular multi-dimensional parameter grids across time, inclination, and pressure coordinates for academic research and model benchmarking."
        badge={<Badge variant="outline">Batch Generator</Badge>}
      />

      {/* Backend connectivity warning */}
      {backendConnected === false && (
        <Alert variant="error">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Scientific Engine Unavailable</AlertTitle>
          <AlertDescription>
            Cannot reach the FastAPI backend. Start the server with{" "}
            <code className="font-mono text-xs">python run.py</code> from the project root,
            then reload this page.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: Configuration panel (5 cols) ── */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerate} noValidate>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid className="w-4 h-4 text-primary" />
                    Grid Configuration
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 text-xs text-foreground/60"
                    aria-label="Reset form to defaults"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
                <CardDescription>
                  Specify step counts and boundary intervals for each dimension.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Step counts */}
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Step Resolution per Dimension
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <InputField
                      label="Time Steps"
                      type="number"
                      min="2"
                      max="100"
                      value={form.timeSteps}
                      onChange={set("timeSteps")}
                      required
                    />
                    <InputField
                      label="Angle Steps"
                      type="number"
                      min="2"
                      max="50"
                      value={form.angleSteps}
                      onChange={set("angleSteps")}
                      required
                    />
                    <InputField
                      label="Pressure Steps"
                      type="number"
                      min="2"
                      max="50"
                      value={form.pressureSteps}
                      onChange={set("pressureSteps")}
                      required
                    />
                  </div>
                </div>

                {/* Boundary intervals */}
                <div className="space-y-3 pt-2 border-t border-surface-border">
                  <div className="text-xs font-semibold text-foreground">
                    Parameter Boundary Intervals
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Time"
                      unit="hr"
                      type="number"
                      value={form.timeMin}
                      onChange={set("timeMin")}
                    />
                    <InputField
                      label="Max Time"
                      unit="hr"
                      type="number"
                      value={form.timeMax}
                      onChange={set("timeMax")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Angle"
                      unit="°"
                      type="number"
                      value={form.angleMin}
                      onChange={set("angleMin")}
                    />
                    <InputField
                      label="Max Angle"
                      unit="°"
                      type="number"
                      value={form.angleMax}
                      onChange={set("angleMax")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Pressure"
                      unit="psi"
                      type="number"
                      value={form.pressureMin}
                      onChange={set("pressureMin")}
                    />
                    <InputField
                      label="Max Pressure"
                      unit="psi"
                      type="number"
                      value={form.pressureMax}
                      onChange={set("pressureMax")}
                    />
                  </div>
                </div>

                {/* Calibration */}
                <div className="pt-1">
                  <SelectField
                    label="Calibration Basis"
                    value={form.calibration}
                    onChange={set("calibration")}
                    options={[
                      { value: "experimental", label: "Experimental Calibration" },
                      { value: "model", label: "Model Calibration" },
                    ]}
                  />
                </div>

                {/* Projected row count */}
                <div
                  className={`p-3 rounded border text-xs space-y-1 ${
                    isOverLimit
                      ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                      : "bg-surface-muted border-surface-border"
                  }`}
                  aria-label="Projected grid volume"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">Projected Grid Volume:</span>
                    <span
                      className={`font-mono font-bold ${
                        isOverLimit ? "text-scientific-error" : "text-foreground"
                      }`}
                    >
                      {projectedRows.toLocaleString()} rows
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-foreground/50">
                    <span>= {tSteps} × {aSteps} × {pSteps}</span>
                    <span>Limit: {MAX_ROWS.toLocaleString()} rows</span>
                  </div>
                </div>

                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Configuration Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {validationErrors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Domain extrapolation warnings */}
                {validationErrors.length === 0 && domainWarnings.length > 0 && (
                  <Alert variant="warning">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Extrapolation Outside Calibrated Parameter Ranges</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {domainWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] text-foreground/60">
                        Generation is permitted but results outside calibrated ranges should be
                        interpreted with caution.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Stale warning */}
                {isStale && (
                  <Alert variant="warning">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Configuration Changed</AlertTitle>
                    <AlertDescription>
                      The current configuration differs from the last generated dataset.
                      Re-generate to refresh results.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Generation API error */}
                {generationError && (
                  <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>{generationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="pt-3">
                <Button
                  type="submit"
                  disabled={!canSubmit || validationErrors.length > 0}
                  className="w-full gap-2"
                  aria-label="Generate dataset preview"
                >
                  {isGenerating ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Generate Dataset Preview
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* ── Right: Results panel (7 cols) ── */}
        <div className="lg:col-span-7 space-y-5">
          {!datasetResponse && !isGenerating ? (
            <EmptyState
              icon={<Database className="w-6 h-6 text-primary" />}
              title="Awaiting Grid Configuration"
              description="Configure step counts and boundary intervals on the left, then click 'Generate Dataset Preview' to compute the dataset."
              className="min-h-[460px]"
            />
          ) : isGenerating ? (
            <Card className="min-h-[460px] flex items-center justify-center">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-foreground/70">
                  Computing {projectedRows.toLocaleString()} grid points…
                </p>
                <p className="text-xs text-foreground/50">
                  Calling <code className="font-mono">POST /api/v1/datasets</code>
                </p>
              </CardContent>
            </Card>
          ) : datasetResponse ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* ── Summary statistics card ── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    Dataset Summary
                    {isStale && (
                      <Badge variant="warning" className="ml-2 text-[10px]">
                        Stale
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{calibrationLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                    <StatRow label="Total Rows" value={datasetResponse.row_count.toLocaleString()} />
                    <StatRow label="Off-Path Rows" value={datasetResponse.off_source_path_count.toLocaleString()} />
                    <StatRow label="Unique Time Values" value={tSteps.toString()} />
                    <StatRow label="Unique Angle Values" value={aSteps.toString()} />
                    <StatRow label="Unique Pressure Values" value={pSteps.toString()} />
                    <StatRow
                      label="h min / max (preview)"
                      value={
                        hMin !== null && hMax !== null
                          ? `${hMin.toFixed(5)} / ${hMax.toFixed(5)} cm`
                          : "—"
                      }
                    />
                    <StatRow
                      label="Q min / max (preview)"
                      value={
                        qMin !== null && qMax !== null
                          ? `${qMin.toFixed(4)} / ${qMax.toFixed(4)} cc`
                          : "—"
                      }
                    />
                  </div>
                  <p className="mt-3 text-[11px] text-foreground/50">
                    h and Q min/max are derived from the {PREVIEW_ROWS}-row preview and may not
                    reflect global extremes across the full dataset.
                  </p>
                </CardContent>
              </Card>

              {/* ── Preview table card ── */}
              <Card>
                <CardHeader className="pb-3 flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">Grid Dataset Preview</CardTitle>
                    <CardDescription>
                      Showing up to {PREVIEW_ROWS} rows of{" "}
                      {datasetResponse.row_count.toLocaleString()} total — export CSV for the
                      complete dataset.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleExport}
                      disabled={isExporting || isGenerating || !datasetResponse}
                      aria-label="Export full dataset as CSV"
                    >
                      {isExporting ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Exporting…
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> Export Full CSV
                        </>
                      )}
                    </Button>
                    {exportError && (
                      <p className="text-[10px] text-scientific-error max-w-[180px] text-right">
                        {exportError}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto" role="region" aria-label="Dataset preview table">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-surface-muted text-foreground/70 uppercase text-[10px] font-mono border-y border-surface-border">
                        <tr>
                          <th className="px-3 py-2.5 whitespace-nowrap">time_hr [hr]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">angle_deg [°]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">pressure_psi [psi]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">cake_thickness [cm]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">filtrate_vol [cc]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">path_angle [°]</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">path_status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border font-mono text-foreground/80">
                        {previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-surface-muted/50">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.time_hr.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.deviation_angle_deg.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.mud_pressure_psi.toFixed(1)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-primary font-semibold">
                              {row.cake_thickness_cm.toFixed(5)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-primary font-semibold">
                              {row.filtrate_volume_cc.toFixed(4)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.source_path_angle_deg.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              {row.off_path ? (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
                                  Off Path
                                </Badge>
                              ) : (
                                <Badge variant="valid" className="text-[10px] px-1.5 py-0.5">
                                  On Path
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 text-[11px] text-foreground/50 justify-between flex-wrap gap-2">
                  <span>All values carry SI-compatible engineering units shown in column headers.</span>
                  <span>Calibration: {calibrationLabel}</span>
                </CardFooter>
              </Card>

              {/* ── Scientific limitations note ── */}
              <Card className="border-surface-border bg-surface-muted/40">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <Info className="w-4 h-4 text-foreground/50 mt-0.5 shrink-0" />
                    <div className="text-xs text-foreground/60 space-y-1">
                      <p className="font-semibold text-foreground/70">Scientific Limitations</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>
                          All predictions are computed by the Python scientific engine from
                          Akinsete &amp; Isehunwa (2013). No calculations are performed in the
                          browser.
                        </li>
                        <li>
                          Off-path rows are flagged when the specified inclination deviates from
                          the source-path angle by more than 5°.
                        </li>
                        <li>
                          The dataset does not include bootstrap percentile intervals. For
                          uncertainty estimation, use the Estimation Workspace.
                        </li>
                        <li>
                          Rows outside the calibrated parameter ranges (time 36–120 hr, angle
                          30–90°, pressure 650–4,650 psi) represent extrapolated predictions.
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── small helper component ───────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-foreground/50 text-[11px]">{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
