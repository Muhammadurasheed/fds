import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SCIENTIFIC_DOMAIN } from "@/lib/constants";
import {
  Calculator,
  LineChart,
  Database,
  BookOpen,
  ArrowRight,
  Gauge,
  Droplets,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Computational Analysis of Filtration-Induced Formation Damage"
        description="An engineering calculation and exploratory model interface for evaluating filtration-induced skin formation and filtrate invasion in deviated wellbores."
        badge={<Badge variant="primary">v1.0 Foundation</Badge>}
        actions={
          <Link href="/estimate">
            <Button size="md" className="gap-2">
              Launch Estimate <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      {/* Model Scope & Physical Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Introduction */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engineering Problem & Scope</CardTitle>
              <CardDescription>
                Physical mechanics of mud-cake deposition and filtrate invasion during deviated drilling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <p>
                During rotary drilling of permeable hydrocarbon formations, drilling fluid
                overbalance pressure drives liquid phase (filtrate) into the rock matrix while
                suspended solids deposit on the wellbore wall to create a low-permeability{" "}
                <strong>filter cake</strong>.
              </p>
              <p>
                In deviated and horizontal wells, gravitational settling alters cake deposition
                dynamics, creating asymmetric cake thickness profiles and varying filtrate
                leak-off volumes. This application implements the calibrated computational
                framework of <strong>Akinsete &amp; Isehunwa (2013)</strong> to estimate cake
                thickness and cumulative filtrate loss across variable drilling durations,
                inclinations, and overbalance pressures.
              </p>

              <div className="pt-2">
                <Alert variant="info">
                  <AlertTitle>Intended Application</AlertTitle>
                  <AlertDescription>
                    This tool is an engineering calculator and exploratory model interface for
                    academic study, sensitivity analysis, and coursework. It is not a substitute
                    for laboratory high-temperature high-pressure (HTHP) filter press measurements
                    or 3D multiphase reservoir simulation.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Principal Outputs Panel */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
                Principal Outputs
              </CardTitle>
              <CardDescription>Two fundamental formation damage indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-md bg-surface border border-surface-border">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">
                    Mud-Cake Thickness (h)
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-primary">
                  [ cm ]
                </div>
                <p className="text-[11px] text-foreground/60 mt-1">
                  Physical thickness of the deposited external cake on the borehole wall.
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-surface border border-surface-border">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">
                    Cumulative Filtrate Volume (Q)
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-primary">
                  [ cc ]
                </div>
                <p className="text-[11px] text-foreground/60 mt-1">
                  Total volume of drilling fluid liquid invading the near-wellbore rock.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Primary Input Parameters & Calibration Domain */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Primary Input Parameters &amp; Calibrated Domain
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {SCIENTIFIC_DOMAIN.time.label}
                </span>
                <Badge variant="outline">{SCIENTIFIC_DOMAIN.time.unit}</Badge>
              </div>
              <div className="text-lg font-mono font-bold text-foreground">
                {SCIENTIFIC_DOMAIN.time.min} – {SCIENTIFIC_DOMAIN.time.max}{" "}
                <span className="text-xs font-normal text-foreground/60">hr</span>
              </div>
              <p className="text-xs text-foreground/70">
                {SCIENTIFIC_DOMAIN.time.description}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {SCIENTIFIC_DOMAIN.angle.label}
                </span>
                <Badge variant="outline">{SCIENTIFIC_DOMAIN.angle.unit}</Badge>
              </div>
              <div className="text-lg font-mono font-bold text-foreground">
                {SCIENTIFIC_DOMAIN.angle.min} – {SCIENTIFIC_DOMAIN.angle.max}{" "}
                <span className="text-xs font-normal text-foreground/60">deg</span>
              </div>
              <p className="text-xs text-foreground/70">
                {SCIENTIFIC_DOMAIN.angle.description}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {SCIENTIFIC_DOMAIN.pressure.label}
                </span>
                <Badge variant="outline">{SCIENTIFIC_DOMAIN.pressure.unit}</Badge>
              </div>
              <div className="text-lg font-mono font-bold text-foreground">
                {SCIENTIFIC_DOMAIN.pressure.min} – {SCIENTIFIC_DOMAIN.pressure.max}{" "}
                <span className="text-xs font-normal text-foreground/60">psi</span>
              </div>
              <p className="text-xs text-foreground/70">
                {SCIENTIFIC_DOMAIN.pressure.description}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflow Entry Points */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">
          Available Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Calculator className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">1. Estimate</CardTitle>
              <CardDescription>
                Point calculation for specific well coordinates with 95% bootstrap uncertainty intervals.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/estimate" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Open Calculator <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center mb-2">
                <LineChart className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">2. Parametric Charts</CardTitle>
              <CardDescription>
                Interactive 1D sweeps across time, deviation angle, or pressure with overlaid experimental observations.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/charts" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  View Sweeps <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Database className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">3. Dataset Generator</CardTitle>
              <CardDescription>
                Generate multi-variable structured grid arrays and download labelled CSV datasets for research.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/dataset" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Configure Grid <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">4. Methodology</CardTitle>
              <CardDescription>
                Detailed review of the governing equations, fitting constants, drilling path, and known limitations.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/methodology" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Read Method <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Model Validity Notice */}
      <Alert variant="warning">
        <AlertTitle>Scientific Scope &amp; Separability Notice</AlertTitle>
        <AlertDescription>
          In the underlying empirical study, exposure time and deviation angle follow an inferred
          drilling path given by &theta;<sub>path</sub>(t) = 20 + (10/24)&middot;t. Any
          point calculated away from this source path by more than 5&deg; relies on the separability
          assumption.
        </AlertDescription>
      </Alert>
    </div>
  );
}
