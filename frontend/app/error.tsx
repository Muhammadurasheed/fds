"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="p-3 bg-red-100 text-red-800 rounded-full mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Computation Workspace Error
      </h2>
      <p className="text-xs text-foreground/70 max-w-md mb-6 leading-relaxed">
        An unexpected client-side error occurred while rendering the engineering interface.
        Scientific state has been preserved.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} size="md" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
      </div>
    </div>
  );
}
