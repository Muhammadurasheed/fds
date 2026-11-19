"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

type ApiStatus = "online" | "offline" | "checking";

export function HealthStatusBadge() {
  const [status, setStatus] = React.useState<ApiStatus>("checking");
  const [modelVersion, setModelVersion] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${apiUrl}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStatus("online");
            setModelVersion(data.model_version || "1.0.0");
          }
        } else {
          if (isMounted) setStatus("offline");
        }
      } catch {
        if (isMounted) setStatus("offline");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const badgeContent = (
    <div className="flex items-center gap-1.5 cursor-default">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          status === "online"
            ? "bg-emerald-500 animate-pulse"
            : status === "checking"
            ? "bg-amber-400"
            : "bg-slate-400"
        }`}
      />
      <span className="font-mono text-[11px]">
        {status === "online"
          ? `Engine Online ${modelVersion ? `v${modelVersion}` : ""}`
          : status === "checking"
          ? "Checking Engine..."
          : "Engine Standby"}
      </span>
    </div>
  );

  const tooltipText =
    status === "online"
      ? `FastAPI computational backend is reachable at ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}. Model loaded.`
      : status === "checking"
      ? "Pinging FastAPI calculation service..."
      : "Backend is not currently running. Start the backend with 'conda activate fds-api' and 'python run.py'.";

  return (
    <Tooltip content={tooltipText}>
      <Badge
        variant={
          status === "online" ? "valid" : status === "checking" ? "warning" : "default"
        }
        className="px-2 py-0.5"
      >
        {badgeContent}
      </Badge>
    </Tooltip>
  );
}
