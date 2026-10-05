import { AskProvider } from "@/components/ask/AskProvider";
import { askShellData } from "@/components/ask/askScope";
import { TopBar } from "@/components/shell/TopBar";
import { IconSprite } from "@/components/ui/IconSprite";
import type { Lang } from "@/lib/data/types";
import { SHELL } from "@/lib/site-shell";
import { anekLatin, anekPlate, interCore } from "./fonts";
import "./site.css";

// EXE23: the one document shell behind every root layout. The site's pages (app/(site)/layout.tsx),
// the phone screens (app/(phone)/layout.tsx, lang="hi", and app/(phone-en)/layout.tsx, lang="en":
// <html lang> is the page's language on first paint) and the global 404 (app/global-not-found.tsx) all render this, so the fonts, the
// stylesheet, the icon sprite and Ask Urja can't drift apart between them.
//
// Design.md §12 typography: app/fonts.ts self-hosts Google's Inter and Anek Devanagari files through
// next/font/local (M-004, EXE18) and sets --font / --font-hi / --font-plate, replacing lamp.css's Google Fonts
// @import and its stacks. Only the Inter core face is preloaded; English pages never fetch Devanagari.
// Fallback metrics (M-004 CLS). next/font's automatic fallback is Arial sized to Inter's text
// widths (107%) and only as local(Arial), so Linux/Android fell through to the default serif, and
// Inter's opsz axis makes display sizes (the verdict, the /why statement) narrower than that, so
// the swap re-wrapped headings. globals.css defines "Inter Fallback Arial" (Arial and its metric
// twins Liberation Sans/Arimo) and "Inter Fallback Roboto" at a size that keeps body and display
// lines wrapping alike; sans-serif closes the stack. The look once Inter has loaded is unchanged.

type RootDocumentProps = Readonly<{
  lang: Lang;
  /** The global TopBar. The phone screens carry their own bar and menu (EXE12), so they pass false. */
  topBar: boolean;
  children: React.ReactNode;
}>;

export function RootDocument({ lang, topBar, children }: RootDocumentProps) {
  // TKT-12: Ask Urja is mounted once for every route; its scope line is computed here, on the server.
  const ask = askShellData();
  return (
    <html lang={lang} className={`${interCore.variable} ${anekLatin.variable} ${anekPlate.variable}`}>
      <body>
        <IconSprite />
        <AskProvider scope={ask.scope} saved={ask.saved}>
          {topBar ? <TopBar fleetName={SHELL.fleetName} truckCount={SHELL.truckCount} /> : null}
          {children}
        </AskProvider>
      </body>
    </html>
  );
}
