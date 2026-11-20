"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RotateCw,
  Copy,
  Check,
  Layers,
  Droplets,
  Wrench,
  Activity,
} from "lucide-react";
import { AIInterpretationResponse } from "@/app/api/ai/interpretation/route";

interface AIInterpretationCardProps {
  timeHr: number;
  angleDeg: number;
  pressurePsi: number;
  calibration: string;
  cakeThicknessCm: number;
  filtrateVolumeCc: number;
  withinDomain?: boolean;
  onSourcePath?: boolean;
}

export function AIInterpretationCard({
  timeHr,
  angleDeg,
  pressurePsi,
  calibration,
  cakeThicknessCm,
  filtrateVolumeCc,
  withinDomain = true,
  onSourcePath = true,
}: AIInterpretationCardProps) {
  const [data, setData] = React.useState<AIInterpretationResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const fetchAssessment = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time_hr: timeHr,
          deviation_angle_deg: angleDeg,
          mud_pressure_psi: pressurePsi,
          calibration,
          cake_thickness_cm: cakeThicknessCm,
          filtrate_volume_cc: filtrateVolumeCc,
          within_domain: withinDomain,
          on_source_path: onSourcePath,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load AI assessment:", err);
    } finally {
      setLoading(false);
    }
  }, [timeHr, angleDeg, pressurePsi, calibration, cakeThicknessCm, filtrateVolumeCc, withinDomain, onSourcePath]);

  React.useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const handleCopy = () => {
    if (!data) return;
    const text = `Formation Damage Assessment (Gemini AI)\n` +
      `Verdict: ${data.flag_label}\n` +
      `Summary: ${data.headline}\n\n` +
      `Mud-Cake Analysis (h = ${cakeThicknessCm.toFixed(4)} cm):\n${data.cake_analysis}\n\n` +
      `Filtrate Invasion Analysis (Q = ${filtrateVolumeCc.toFixed(2)} cc):\n${data.filtrate_analysis}\n\n` +
      `Operational Risks:\n${data.operational_risks.map((r) => `• ${r}`).join("\n")}\n\n` +
      `Mitigation Recommendations:\n${data.recommendations.map((m) => `• ${m}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const flagTheme = React.useMemo(() => {
    const flag = data?.flag || "green";
    switch (flag) {
      case "green":
        return {
          border: "border-emerald-300 dark:border-emerald-800",
          bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
          headerBg: "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          badgeVariant: "valid" as const,
          badgeColor: "bg-emerald-600 text-white",
        };
      case "yellow":
        return {
          border: "border-amber-300 dark:border-amber-800",
          bg: "bg-amber-50/50 dark:bg-amber-950/20",
          headerBg: "bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          badgeVariant: "warning" as const,
          badgeColor: "bg-amber-600 text-white",
        };
      case "red":
      default:
        return {
          border: "border-red-300 dark:border-red-800",
          bg: "bg-red-50/50 dark:bg-red-950/20",
          headerBg: "bg-red-100/70 dark:bg-red-900/40 text-red-900 dark:text-red-100",
          icon: <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />,
          badgeVariant: "error" as const,
          badgeColor: "bg-red-600 text-white",
        };
    }
  }, [data?.flag]);

  return (
    <Card className={`border shadow-sm transition-colors duration-200 ${flagTheme.border} ${flagTheme.bg}`}>
      <CardHeader className="pb-3 border-b border-surface-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5 shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Gemini AI Formation Damage Assessment
                </CardTitle>
                {data?.source === "gemini" ? (
                  <Badge variant="outline" className="text-[10px] py-0 font-mono text-primary border-primary/30">
                    Gemini 3.5 Flash Lite
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] py-0 font-mono text-foreground/60">
                    Rule Engine
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Real-time operational petroleum engineering interpretation of simulation values.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto pt-1 md:pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchAssessment}
              disabled={loading}
              className="h-7 text-xs px-2.5 gap-1.5 whitespace-nowrap shrink-0"
              title="Request a fresh AI analysis from Gemini"
            >
              <RotateCw className={`w-3 h-3 shrink-0 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>{loading ? "Analyzing..." : "Re-Analyze"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!data || loading}
              className="h-7 text-xs px-2.5 gap-1.5 whitespace-nowrap shrink-0"
              title="Copy engineering assessment to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs pt-4">
        {loading && !data ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-foreground/60">
            <LoadingSpinner size="md" />
            <p className="text-xs">Analyzing cake thickness and filtrate volume with Gemini AI...</p>
          </div>
        ) : data ? (
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            {/* Operational Health Banner */}
            <div className={`p-3 rounded-md flex items-start gap-2.5 ${flagTheme.headerBg}`}>
              <div className="mt-0.5">{flagTheme.icon}</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-xs uppercase">
                    {data.flag_label}
                  </span>
                </div>
                <p className="font-medium text-xs leading-relaxed">
                  {data.headline}
                </p>
              </div>
            </div>

            {/* Core Metrics Practical Meaning Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Cake Thickness Meaning */}
              <div className="p-3 rounded border border-surface-border bg-surface space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Mud-Cake Quality &amp; Sticking Risk
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    h = {cakeThicknessCm.toFixed(4)} cm
                  </Badge>
                </div>
                <p className="text-foreground/75 leading-relaxed">
                  {data.cake_analysis}
                </p>
              </div>

              {/* Filtrate Volume Meaning */}
              <div className="p-3 rounded border border-surface-border bg-surface space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    Filtrate Invasion &amp; Skin Effect
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Q = {filtrateVolumeCc.toFixed(2)} cc (cm³)
                  </Badge>
                </div>
                <p className="text-foreground/75 leading-relaxed">
                  {data.filtrate_analysis}
                </p>
              </div>
            </div>

            {/* Operational Risks & Mitigations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Operational Risks */}
              <div className="p-3 rounded border border-surface-border bg-surface space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Key Operational Hazards
                </span>
                <ul className="list-disc list-inside space-y-1 text-foreground/70 leading-relaxed">
                  {data.operational_risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>

              {/* Drilling Fluid Recommendations */}
              <div className="p-3 rounded border border-surface-border bg-surface space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                  Engineering Mitigation Actions
                </span>
                <ul className="list-disc list-inside space-y-1 text-foreground/70 leading-relaxed">
                  {data.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
