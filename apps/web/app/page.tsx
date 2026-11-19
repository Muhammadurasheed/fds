import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-surface-border bg-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg text-primary tracking-tight">Formation Damage Simulator</span>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-muted text-foreground/70 font-mono">v1.0.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-scientific-valid"></span>
          <span className="text-xs text-foreground/70 font-medium">Foundation Online</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Computational Analysis of Filtration-Induced Formation Damage
          </h1>
          <p className="text-base text-foreground/80 leading-relaxed mb-8">
            An engineering calculation and exploratory model interface for estimating mud-cake thickness
            and cumulative filtrate volume in a deviated well, anchored to the calibrated experimental curves of
            Akinsete &amp; Isehunwa (2013).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-surface-border bg-surface">
              <h3 className="font-semibold text-primary mb-1">1. Estimate</h3>
              <p className="text-sm text-foreground/70">Single-point drilling condition calculation with uncertainty bands and domain checks.</p>
            </div>
            <div className="p-4 rounded-lg border border-surface-border bg-surface">
              <h3 className="font-semibold text-primary mb-1">2. Charts</h3>
              <p className="text-sm text-foreground/70">Parametric sensitivity sweeps over exposure time, deviation angle, and mud pressure.</p>
            </div>
            <div className="p-4 rounded-lg border border-surface-border bg-surface">
              <h3 className="font-semibold text-primary mb-1">3. Dataset Generator</h3>
              <p className="text-sm text-foreground/70">Export structured grids for external research, model benchmarking, and coursework.</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-muted border border-surface-border text-xs text-foreground/80 leading-relaxed">
            <strong className="font-semibold text-foreground">Calibrated Domain:</strong> Exposure time 36–120 hr, deviation angle 30–90°, mud pressure 650–4650 psi. Calculations away from the source drilling path rely on the documented separability assumption.
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-foreground/60">
        Formation Damage in a Deviated Well &bull; Model basis: Akinsete &amp; Isehunwa (2013) &bull; Phase 0 Foundation
      </footer>
    </div>
  );
}
