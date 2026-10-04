import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bikepack3D | Bicycle & Gear Planner",
  description:
    "Explore bicycle geometry, equipment and estimated weight distribution in an illustrative 3D bikepacking planner. Verify loaded fit on your actual bicycle.",
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
