import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-3xl font-bold text-foreground mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-foreground/70 max-w-md mb-6">
        The requested screen does not exist in the Formation Damage Simulator.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary-dark transition-colors"
      >
        Return to Overview
      </Link>
    </div>
  );
}
