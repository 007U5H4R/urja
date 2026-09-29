import type { Metadata } from "next";
import { rootMetadata } from "@/lib/og";
import NotFound from "./(site)/not-found";
import { RootDocument } from "./root-document";

// An address no route matches (technical-plan §3.3, TKT-03). With several root layouts (the site's
// and the phone screens' Hindi and English ones, EXE23) there is no single layout to compose the 404 from, so Next serves this
// whole document instead (experimental.globalNotFound, next.config.ts). It is the same page as the
// site's own not-found: the shared document, the TopBar and the same copy.
export const metadata: Metadata = rootMetadata();

export default function GlobalNotFound() {
  return (
    <RootDocument lang="en" topBar>
      <NotFound />
    </RootDocument>
  );
}
