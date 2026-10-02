import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Bikepacking Rig Configurator | Exact-Fit Gear & Clearance Checker",
  description: "Interactive 3D configurator for bikepacking setups with exact-fit gear catalog, real-time weight distribution balance, and tire clearance validation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
