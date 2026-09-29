import type { Metadata } from "next";
import { Anek_Devanagari, Inter } from "next/font/google";
import { AskProvider } from "@/components/ask/AskProvider";
import { askShellData } from "@/components/ask/askScope";
import { TopBar } from "@/components/shell/TopBar";
import { IconSprite } from "@/components/ui/IconSprite";
import { rootMetadata } from "@/lib/og";
import { SHELL } from "@/lib/site-shell";
import "./globals.css";

// Design.md §12 typography. These variables replace lamp.css's Google Fonts @import
// and its --font / --font-hi stacks; next/font adds a metric-matched fallback face.
// Fallback metrics (M-004 CLS). next/font's automatic fallback is Arial sized to Inter's text
// widths (107%) and only as local(Arial), so Linux/Android fell through to the default serif, and
// Inter's opsz axis makes display sizes (the verdict, the /why statement) narrower than that, so
// the swap re-wrapped headings. globals.css defines "Inter Fallback Arial" (Arial and its metric
// twins Liberation Sans/Arimo) and "Inter Fallback Roboto" at a size that keeps body and display
// lines wrapping alike; sans-serif closes the stack. The look once Inter has loaded is unchanged.
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font",
  adjustFontFallback: false,
  fallback: ["Inter Fallback Arial", "Inter Fallback Roboto", "sans-serif"],
});

const anek = Anek_Devanagari({
  subsets: ["devanagari", "latin"],
  axes: ["wdth"],
  variable: "--font-hi",
  preload: false,
  fallback: ["sans-serif"],
});

// technical-plan §9: metadataBase, the "%s · Urja" template and the site-wide OG/Twitter set.
export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TKT-12: Ask Urja is mounted once for every route; its scope line is computed here, on the server.
  const ask = askShellData();
  return (
    <html lang="en" className={`${inter.variable} ${anek.variable}`}>
      <body>
        <IconSprite />
        <AskProvider scope={ask.scope} saved={ask.saved}>
          <TopBar fleetName={SHELL.fleetName} truckCount={SHELL.truckCount} />
          {children}
        </AskProvider>
      </body>
    </html>
  );
}
