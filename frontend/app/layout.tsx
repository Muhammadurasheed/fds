import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formation Damage Simulator",
  description:
    "Computational analysis of filtration-induced formation damage in deviated wells.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-foreground bg-background">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
