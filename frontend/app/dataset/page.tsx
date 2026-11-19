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
  Database,
  Download,
  Grid,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function DatasetPage() {
  // Step counts
  const [timeSteps, setTimeSteps] = React.useState("25");
  const [angleSteps, setAngleSteps] = React.useState("13");
  const [pressureSteps, setPressureSteps] = React.useState("15");

  // Ranges
  const [timeMin, setTimeMin] = React.useState("36.0");
  const [timeMax, setTimeMax] = React.useState("120.0");
  const [angleMin, setAngleMin] = React.useState("30.0");
  const [angleMax, setAngleMax] = React.useState("90.0");
  const [pressureMin, setPressureMin] = React.useState("650.0");
  const [pressureMax, setPressureMax] = React.useState("4650.0");

  const [calibration, setCalibration] = React.useState("experimental");
  const [isGenerated, setIsGenerated] = React.useState(false);

  // Computed row count
  const numT = parseInt(timeSteps) || 0;
  const numA = parseInt(angleSteps) || 0;
  const numP = parseInt(pressureSteps) || 0;
  const projectedRows = numT * numA * numP;
  const MAX_ROWS = 50000;
  const isOverLimit = projectedRows > MAX_ROWS;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOverLimit) {
      setIsGenerated(true);
    }
  };

  const handleReset = () => {
    setTimeSteps("25");
    setAngleSteps("13");
    setPressureSteps("15");
    setTimeMin("36.0");
    setTimeMax("120.0");
    setAngleMin("30.0");
    setAngleMax("90.0");
    pressureMin && setPressureMin("650.0");
    pressureMax && setPressureMax("4650.0");
    setIsGenerated(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Structured Grid Dataset Generator"
        description="Synthesise regular multi-dimensional parameter grids across time, inclination, and pressure coordinates for academic research and model benchmarking."
        badge={<Badge variant="outline">Batch Generator</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Grid Dimensions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerate}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid className="w-4 h-4 text-primary" />
                    Grid Step Resolution
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
                  Specify the number of discrete evaluation points per dimension.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <InputField
                    label="Time Steps"
                    type="number"
                    min="2"
                    max="100"
                    value={timeSteps}
                    onChange={(e) => setTimeSteps(e.target.value)}
                    required
                  />
                  <InputField
                    label="Angle Steps"
                    type="number"
                    min="2"
                    max="50"
                    value={angleSteps}
                    onChange={(e) => setAngleSteps(e.target.value)}
                    required
                  />
                  <InputField
                    label="Pressure Steps"
                    type="number"
                    min="2"
                    max="50"
                    value={pressureSteps}
                    onChange={(e) => setPressureSteps(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-3 border-t border-surface-border space-y-3">
                  <div className="text-xs font-semibold text-foreground">
                    Parameter Boundary Intervals
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Time"
                      unit="hr"
                      type="number"
                      value={timeMin}
                      onChange={(e) => setTimeMin(e.target.value)}
                    />
                    <InputField
                      label="Max Time"
                      unit="hr"
                      type="number"
                      value={timeMax}
                      onChange={(e) => setTimeMax(e.target.value)}
                    />
                  </div>

                  {/* Angle Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Angle"
                      unit="°"
                      type="number"
                      value={angleMin}
                      onChange={(e) => setAngleMin(e.target.value)}
                    />
                    <InputField
                      label="Max Angle"
                      unit="°"
                      type="number"
                      value={angleMax}
                      onChange={(e) => setAngleMax(e.target.value)}
                    />
                  </div>

                  {/* Pressure Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Min Pressure"
                      unit="psi"
                      type="number"
                      value={pressureMin}
                      onChange={(e) => setPressureMin(e.target.value)}
                    />
                    <InputField
                      label="Max Pressure"
                      unit="psi"
                      type="number"
                      value={pressureMax}
                      onChange={(e) => setPressureMax(e.target.value)}
                    />
                  </div>
                </div>

                {/* Calibration Option */}
                <div className="pt-2">
                  <SelectField
                    label="Calibration Basis"
                    value={calibration}
                    onChange={(e) => setCalibration(e.target.value)}
                    options={SCIENTIFIC_DOMAIN.calibrations.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </div>

                {/* Projected Row Count Summary */}
                <div className="p-3 rounded bg-surface-muted border border-surface-border text-xs space-y-1">
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
                    <span>Server Safety Cap:</span>
                    <span>{MAX_ROWS.toLocaleString()} rows</span>
                  </div>
                </div>

                {isOverLimit && (
                  <Alert variant="error">
                    <AlertTitle>Volume Limit Exceeded</AlertTitle>
                    <AlertDescription>
                      Requested grid contains {projectedRows.toLocaleString()} rows. Please reduce
                      step counts to stay below {MAX_ROWS.toLocaleString()} rows.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="pt-3">
                <Button
                  type="submit"
                  disabled={isOverLimit || projectedRows <= 0}
                  className="w-full gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Generate Dataset Preview
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Right Area: Preview Table & Export (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!isGenerated ? (
            <EmptyState
              icon={<Database className="w-6 h-6 text-primary" />}
              title="Awaiting Grid Configuration"
              description="Configure step counts and boundary bounds on the left, then click 'Generate Dataset Preview' to inspect the grid schema."
              className="min-h-[460px]"
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Phase 1 Design Preview Notice */}
              <Alert variant="info">
                <AlertTitle className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Phase 1 Dataset Structure Preview — Live Generation in Phase 5
                </AlertTitle>
                <AlertDescription>
                  This table preview demonstrates the structured column schema and export interface.
                  In accordance with the project contract, actual streaming CSV generation and
                  point calculations will connect to `POST /api/v1/datasets` in Phase 5.
                </AlertDescription>
              </Alert>

              {/* Table Card */}
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Grid Dataset Preview</CardTitle>
                    <CardDescription>
                      Showing top 5 schema rows ({projectedRows.toLocaleString()} total rows planned)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" disabled>
                    <Download className="w-3.5 h-3.5" /> Export Full CSV
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-surface-muted text-foreground/70 uppercase text-[10px] font-mono border-y border-surface-border">
                        <tr>
                          <th className="px-4 py-2.5">time_hr</th>
                          <th className="px-4 py-2.5">angle_deg</th>
                          <th className="px-4 py-2.5">pressure_psi</th>
                          <th className="px-4 py-2.5">cake_thickness_cm</th>
                          <th className="px-4 py-2.5">filtrate_vol_cc</th>
                          <th className="px-4 py-2.5">on_source_path</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border font-mono text-foreground/80">
                        <tr className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2">{parseFloat(timeMin).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(angleMin).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(pressureMin).toFixed(1)}</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">Separable</Badge>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2">{parseFloat(timeMin).toFixed(1)}</td>
                          <td className="px-4 py-2">
                            {(parseFloat(angleMin) + (parseFloat(angleMax) - parseFloat(angleMin)) / 2).toFixed(1)}
                          </td>
                          <td className="px-4 py-2">{parseFloat(pressureMin).toFixed(1)}</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">Separable</Badge>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2">{parseFloat(timeMin).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(angleMax).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(pressureMin).toFixed(1)}</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">Separable</Badge>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2">
                            {(parseFloat(timeMin) + (parseFloat(timeMax) - parseFloat(timeMin)) / 2).toFixed(1)}
                          </td>
                          <td className="px-4 py-2">60.0</td>
                          <td className="px-4 py-2">2650.0</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2">
                            <Badge variant="valid">Source Path</Badge>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2">{parseFloat(timeMax).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(angleMax).toFixed(1)}</td>
                          <td className="px-4 py-2">{parseFloat(pressureMax).toFixed(1)}</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2 text-primary font-semibold">--.--</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">Separable</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 text-[11px] text-foreground/50 justify-between">
                  <span>Columns carry explicit engineering units in header names.</span>
                  <span>Calibration: {calibration}</span>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
