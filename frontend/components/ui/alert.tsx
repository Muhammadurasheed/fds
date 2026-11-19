import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "error" | "success";
}

export function Alert({
  className,
  variant = "info",
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: "bg-sky-50 text-sky-900 border-sky-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    error: "bg-red-50 text-red-900 border-red-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  };

  const icons = {
    info: <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-md border p-3.5 text-xs leading-relaxed",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("font-semibold text-xs tracking-tight", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-xs opacity-90", className)}
      {...props}
    />
  );
}
