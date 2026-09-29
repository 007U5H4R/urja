import type { Metadata } from "next";
import { rootMetadata } from "@/lib/og";
import { RootDocument } from "../root-document";

// The root layout of every English page: Today, Trips, Why Urja, the OG card and their 404.
// It reads no request data (headers, cookies, params), so these pages stay statically prerendered.
// The phone screens have their own root layouts (app/(phone)/layout.tsx in Hindi and
// app/(phone-en)/layout.tsx in English, EXE23); moving between root layouts is a full page load.

// technical-plan §9: metadataBase, the "%s · Urja" template and the site-wide OG/Twitter set.
export const metadata: Metadata = rootMetadata();

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RootDocument lang="en" topBar>
      {children}
    </RootDocument>
  );
}
