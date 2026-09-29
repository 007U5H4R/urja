import type { Metadata } from "next";
import { rootMetadata } from "@/lib/og";
import { RootDocument } from "../root-document";

// EXE23 (accessibility): the phone screens' own root layouts, so the server-rendered <html lang> is
// the page's language on first paint, with or without scripts. This one serves /brief and /message
// in Hindi, the default; app/(phone-en)/layout.tsx serves them for ?lang=en, which next.config.ts
// rewrites (not redirects) to /en/brief and /en/message, query and all. The address bar and the
// canonical link (lib/metadata.ts) keep the public URL. useLang keeps <html lang> in step when the
// toggle switches language in place. The site's pages keep their static root layout
// (app/(site)/layout.tsx); moving between root layouts is a full page load.

// technical-plan §9: metadataBase, the "%s · Urja" template and the site-wide OG/Twitter set.
export const metadata: Metadata = rootMetadata();

export default function PhoneLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RootDocument lang="hi" topBar={false}>
      {children}
    </RootDocument>
  );
}
