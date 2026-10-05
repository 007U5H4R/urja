import type { Metadata } from "next";
import { rootMetadata } from "@/lib/og";
import { RootDocument } from "../root-document";

// EXE23: the English phone screens' root layout, <html lang="en"> on first paint. The pages under
// en/ are /brief?lang=en and /message?lang=en (next.config.ts rewrites them here); a direct hit on
// /en/… redirects to that public URL. See app/(phone)/layout.tsx.

// technical-plan §9: metadataBase, the "%s · Urja" template and the site-wide OG/Twitter set.
export const metadata: Metadata = rootMetadata();

export default function PhoneEnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RootDocument lang="en" topBar={false}>
      {children}
    </RootDocument>
  );
}
