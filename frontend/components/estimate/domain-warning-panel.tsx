"use client";

import * as React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DomainStatus } from "@/lib/api";
import { CheckCircle2, AlertTriangle, AlertCircle, Compass } from "lucide-react";

interface DomainWarningPanelProps {
  domain: DomainStatus;
  timeHr: number;
  angleDeg: number;
}

export function DomainWarningPanel({ domain, timeHr, angleDeg }: DomainWarningPanelProps) {
  const { within_calibrated_ranges, on_source_path, source_path_angle_deg, warnings } = domain;

  return (
    <div className="space-y-3">
      {/* Status Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {within_calibrated_ranges ? (
          <Badge variant="valid" className="gap-1 py-1 px-2.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Within Calibrated Experimental Domain
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1 py-1 px-2.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Domain Extrapolation Active
          </Badge>
        )}

        {on_source_path ? (
          <Badge variant="outline" className="gap-1 py-1 px-2.5 text-foreground/80">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Aligned with Source Drilling Path (±5°)
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1 py-1 px-2.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Separability Assumption Active
          </Badge>
        )}
      </div>

      {/* Trajectory Inferred Angle Detail */}
      <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-foreground/70 space-y-1">
        <div className="font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Source Wellbore Trajectory Reference
          </span>
          <span className="font-mono text-[11px] text-foreground/60">
            θ_path(t) = 20° + (10/24) · t
          </span>
        </div>
        <p className="leading-relaxed">
          At an exposure duration of <span className="font-mono font-medium text-foreground">{timeHr} hr</span>,
          the baseline source inclination is{" "}
          <span className="font-mono font-bold text-foreground">{source_path_angle_deg}°</span>.
          {on_source_path ? (
            <span className="text-emerald-700 ml-1">
              Your input angle ({angleDeg}°) lies within ±5° of this reference trajectory.
            </span>
          ) : (
            <span className="text-amber-800 ml-1">
              Your input angle ({angleDeg}°) deviates by {Math.abs(angleDeg - source_path_angle_deg).toFixed(1)}°
              from the reference trajectory; predictions decouple inclination via multiplicative separability.
            </span>
          )}
        </p>
      </div>

      {/* Explicit Domain Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, idx) => (
            <Alert key={idx} variant="warning">
              <AlertTitle className="flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Scientific Scope Notice
              </AlertTitle>
              <AlertDescription className="text-amber-900/90 text-xs mt-0.5">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
