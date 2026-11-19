import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="p-3 bg-surface-muted text-foreground/50 rounded-full mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">404 - Module Not Found</h2>
      <p className="text-xs text-foreground/70 max-w-md mb-6 leading-relaxed">
        The requested trajectory or workspace module does not exist in the Formation Damage Simulator.
      </p>
      <Link href="/">
        <Button variant="outline" size="md" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Overview
        </Button>
      </Link>
    </div>
  );
}
