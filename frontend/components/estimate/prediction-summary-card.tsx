"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PredictionInputs } from "@/lib/api";
import { RefreshCw, CheckCheck } from "lucide-react";

interface PredictionSummaryCardProps {
  lastInputs: PredictionInputs;
  currentInputs: {
    time_hr: number;
    deviation_angle_deg: number;
    mud_pressure_psi: number;
  };
  calibration: string;
  calibrationName: string;
  uncertaintyEnabled: boolean;
  uncertaintyLevel: number;
}

export function PredictionSummaryCard({
  lastInputs,
  currentInputs,
  calibration,
  calibrationName,
  uncertaintyEnabled,
  uncertaintyLevel,
}: PredictionSummaryCardProps) {
  const isModified =
    lastInputs.time_hr !== currentInputs.time_hr ||
    lastInputs.deviation_angle_deg !== currentInputs.deviation_angle_deg ||
    lastInputs.mud_pressure_psi !== currentInputs.mud_pressure_psi;

  return (
    <Card className="bg-surface/80">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/70">
            Calculation Condition Summary
          </CardTitle>
          {isModified ? (
            <Badge variant="warning" className="text-[10px] gap-1 py-0.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Inputs Modified — Recalculate to Update
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 py-0.5 text-emerald-700 border-emerald-300">
              <CheckCheck className="w-3 h-3" />
              Synchronized with Displayed Output
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2 rounded bg-surface-muted/40 border border-surface-border">
            <span className="text-foreground/50 block text-[10px] uppercase font-semibold">Exposure Time</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {lastInputs.time_hr} <span className="text-xs font-normal text-foreground/60">hr</span>
            </span>
          </div>

          <div className="p-2 rounded bg-surface-muted/40 border border-surface-border">
            <span className="text-foreground/50 block text-[10px] uppercase font-semibold">Deviation Angle</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {lastInputs.deviation_angle_deg} <span className="text-xs font-normal text-foreground/60">°</span>
            </span>
          </div>

          <div className="p-2 rounded bg-surface-muted/40 border border-surface-border">
            <span className="text-foreground/50 block text-[10px] uppercase font-semibold">Mud Pressure</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {lastInputs.mud_pressure_psi} <span className="text-xs font-normal text-foreground/60">psi</span>
            </span>
          </div>

          <div className="p-2 rounded bg-surface-muted/40 border border-surface-border">
            <span className="text-foreground/50 block text-[10px] uppercase font-semibold">Calibration & CI</span>
            <span className="font-semibold text-foreground text-xs block truncate" title={calibrationName}>
              {calibration === "experimental" ? "Experimental" : "Model Curve"}
            </span>
            <span className="text-[10px] text-foreground/60">
              {uncertaintyEnabled ? `${uncertaintyLevel}% Bootstrap` : "Point only"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
