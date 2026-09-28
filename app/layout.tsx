import type { Metadata } from "next";
import { Anek_Devanagari, Inter } from "next/font/google";
import { TopBar } from "@/components/shell/TopBar";
import { IconSprite } from "@/components/ui/IconSprite";
import { SHELL } from "@/lib/site-shell";
import "./globals.css";

// Design.md §12 typography. These variables replace lamp.css's Google Fonts @import
// and its --font / --font-hi stacks; next/font adds a metric-matched fallback face.
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font",
});

const anek = Anek_Devanagari({
  subsets: ["devanagari", "latin"],
  axes: ["wdth"],
  variable: "--font-hi",
});

export const metadata: Metadata = {
  title: "Urja",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${anek.variable}`}>
      <body>
        <IconSprite />
        <TopBar fleetName={SHELL.fleetName} truckCount={SHELL.truckCount} />
        {children}
      </body>
    </html>
  );
}
