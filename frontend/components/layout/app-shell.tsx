import * as React from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { TopHeader } from "./top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Navigation */}
      <MobileNav />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-foreground/50">
          Formation Damage in a Deviated Well &bull; Model basis: Akinsete &amp;
          Isehunwa (2013) &bull; Petroleum Engineering Computational Interface
        </footer>
      </div>
    </div>
  );
}
