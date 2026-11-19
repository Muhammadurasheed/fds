import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formation Damage Simulator",
  description: "Computational analysis of filtration-induced formation damage in deviated wells.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
