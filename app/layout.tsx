import type { Metadata } from "next";
import { AskProvider } from "@/components/ask/AskProvider";
import { askShellData } from "@/components/ask/askScope";
import { TopBar } from "@/components/shell/TopBar";
import { IconSprite } from "@/components/ui/IconSprite";
import { rootMetadata } from "@/lib/og";
import { SHELL } from "@/lib/site-shell";
import { anekLatin, anekPlate, interCore } from "./fonts";
import "./site.css";

// Design.md §12 typography: app/fonts.ts self-hosts Google's Inter and Anek Devanagari files through
// next/font/local (M-004, EXE18) and sets --font / --font-hi / --font-plate, replacing lamp.css's Google Fonts
// @import and its stacks. Only the Inter core face is preloaded; English pages never fetch Devanagari.
// Fallback metrics (M-004 CLS). next/font's automatic fallback is Arial sized to Inter's text
// widths (107%) and only as local(Arial), so Linux/Android fell through to the default serif, and
// Inter's opsz axis makes display sizes (the verdict, the /why statement) narrower than that, so
// the swap re-wrapped headings. globals.css defines "Inter Fallback Arial" (Arial and its metric
// twins Liberation Sans/Arimo) and "Inter Fallback Roboto" at a size that keeps body and display
// lines wrapping alike; sans-serif closes the stack. The look once Inter has loaded is unchanged.

// technical-plan §9: metadataBase, the "%s · Urja" template and the site-wide OG/Twitter set.
export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TKT-12: Ask Urja is mounted once for every route; its scope line is computed here, on the server.
  const ask = askShellData();
  return (
    <html lang="en" className={`${interCore.variable} ${anekLatin.variable} ${anekPlate.variable}`}>
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
