import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support AI ROI Dashboard",
  description: "Tool-agnostic AI ROI for Support teams (adoption, time saved, rework, risk).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
