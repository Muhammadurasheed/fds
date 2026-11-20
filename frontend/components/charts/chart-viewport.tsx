"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export interface ChartPoint {
  x: number;
  modelValue: number;
  observedValue?: number | null;
}

interface ChartViewportProps {
  title: string;
  variableSymbol: string;
  unit: string;
  xLabel: string;
  xUnit: string;
  data: ChartPoint[];
  modelLabel?: string;
  observedLabel?: string | null;
  observationNote?: string | null;
  color?: string;
  description?: string;
  hasObservations?: boolean;
}

export function ChartViewport({
  title,
  variableSymbol,
  unit,
  xLabel,
  xUnit,
  data,
  modelLabel = "Fitted Model Curve",
  observedLabel,
  observationNote,
  color = "#0284c7",
  description,
  hasObservations = false,
}: ChartViewportProps) {
  // Compute nice Y-axis domain
  const yValues = data
    .flatMap((d) => [d.modelValue, d.observedValue])
    .filter((v): v is number => typeof v === "number" && !isNaN(v));

  const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
  const maxY = yValues.length > 0 ? Math.max(...yValues) : 1;
  const yPadding = (maxY - minY) * 0.1 || 0.05;
  const domainMin = Math.max(0, Math.floor((minY - yPadding) * 100) / 100);
  const domainMax = Math.ceil((maxY + yPadding) * 100) / 100;

  return (
    <Card className="border-surface-border shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>{title}</span>
          </CardTitle>
          <Badge variant="primary" className="font-mono text-xs">
            {variableSymbol} [{unit}]
          </Badge>
        </div>
        {description && (
          <CardDescription className="text-xs text-foreground/60">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Recharts Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
              <XAxis
                dataKey="x"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => Number(v).toFixed(0)}
                label={{
                  value: `${xLabel} (${xUnit})`,
                  position: "insideBottom",
                  offset: -15,
                  fontSize: 11,
                  fill: "#475569",
                  fontWeight: 500,
                }}
              />
              <YAxis
                type="number"
                domain={[domainMin, domainMax]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => (unit === "cm" ? v.toFixed(3) : v.toFixed(1))}
                label={{
                  value: `${title} (${unit})`,
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  fontSize: 11,
                  fill: "#475569",
                  fontWeight: 500,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const modelVal = payload.find((p) => p.dataKey === "modelValue")?.value;
                    const obsVal = payload.find((p) => p.dataKey === "observedValue")?.value;
                    return (
                      <div className="bg-surface p-3 rounded-lg border border-surface-border shadow-md text-xs space-y-1.5 font-mono">
                        <div className="font-bold text-foreground pb-1 border-b border-surface-border">
                          {xLabel}: {Number(label).toFixed(2)} {xUnit}
                        </div>
                        {modelVal !== undefined && (
                          <div className="flex items-center gap-2 text-sky-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                            <span>Model: {Number(modelVal).toFixed(unit === "cm" ? 4 : 2)} {unit}</span>
                          </div>
                        )}
                        {obsVal !== undefined && obsVal !== null && (
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span>Observed: {Number(obsVal).toFixed(unit === "cm" ? 4 : 2)} {unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
              />

              {/* Continuous Model Prediction Curve */}
              <Line
                type="monotone"
                dataKey="modelValue"
                name={modelLabel}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 1.5, stroke: "#ffffff" }}
                isAnimationActive={false}
              />

              {/* Discrete Experimental Observation Markers (Dots only) */}
              {hasObservations && (
                <Line
                  type="monotone"
                  dataKey="observedValue"
                  name={observedLabel || "Digitised Observation"}
                  stroke="transparent"
                  dot={{
                    r: 4.5,
                    fill: "#10b981",
                    stroke: "#047857",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{ r: 6, fill: "#059669" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Observation Note / Limitation Badge */}
        {observationNote && (
          <div className="p-2.5 rounded bg-surface-muted/60 border border-surface-border flex items-start gap-2 text-[11px] text-foreground/70 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{observationNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
