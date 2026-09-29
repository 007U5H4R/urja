import type { Metadata } from "next";
import { Brief } from "@/components/phone/Brief";
import { YESTERDAY_DAY } from "@/lib/data/aggregates";
import { langParam } from "@/lib/brief/dict";
import { briefMetadata } from "@/lib/metadata";
import { renderBrief } from "@/lib/brief/template";
import "@/components/phone/phone.css";

// TKT-06 (TSK-06.2): final/brief.html. `?lang=` is read on the server so the first
// paint is in the right language (Hindi by default); `?only=high` keeps the High items.
type Search = { searchParams: Promise<{ lang?: string | string[]; only?: string | string[] }> };

const onlyHigh = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) === "high";

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const lang = langParam((await searchParams).lang);
  // TKT-09: the language-aware title plus the full Open Graph and Twitter set.
  return briefMetadata(lang);
}

export default async function BriefPage({ searchParams }: Search) {
  const sp = await searchParams;
  const opts = { onlyHigh: onlyHigh(sp.only) };
  const copy = { hi: renderBrief(YESTERDAY_DAY, "hi", opts), en: renderBrief(YESTERDAY_DAY, "en", opts) };
  return <Brief copy={copy} />;
}
