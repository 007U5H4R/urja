import type { Metadata } from "next";
import { Brief } from "@/components/phone/Brief";
import { BriefState } from "@/components/states/BriefState";
import { YESTERDAY_DAY } from "@/lib/data/aggregates";
import { stateSpecimens } from "@/lib/data/views/states";
import { langParam } from "@/lib/brief/dict";
import { briefMetadata } from "@/lib/metadata";
import { renderBrief } from "@/lib/brief/template";
import { DATA_STATES, parseState } from "@/lib/state";
import { DEMO_NOW } from "@/lib/clock";
import { formatDateIST } from "@/lib/format";
import "@/components/phone/phone.css";

// TKT-06 (TSK-06.2): final/brief.html. `?lang=` is read on the server so the first
// paint is in the right language (Hindi by default); `?only=high` keeps the High items.
// TKT-11: `?state=loading|empty|clean|error` renders that state instead (English, as
// final/states.html); unknown values fall through to the brief. The route already reads
// searchParams on the server, so the state is chosen there too. There is deliberately no
// brief/loading.tsx: its Suspense fallback would stream first and leave the brief itself
// hidden until a script swaps it in, breaking the script-less first paint (TC-027).
type Search = { searchParams: Promise<{ lang?: string | string[]; only?: string | string[]; state?: string | string[] }> };

const onlyHigh = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) === "high";

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const sp = await searchParams;
  // A state screen is English, so its title is too.
  const lang = parseState(sp, DATA_STATES) ? "en" : langParam(sp.lang);
  // TKT-09: the language-aware title plus the full Open Graph and Twitter set.
  return briefMetadata(lang);
}

export default async function BriefPage({ searchParams }: Search) {
  const sp = await searchParams;
  const state = parseState(sp, DATA_STATES);
  if (state) {
    const en = renderBrief(YESTERDAY_DAY, "en");
    // The date alone: the brief's "yesterday's 17 trips reconciled" isn't true in these states.
    return <BriefState state={state} s={stateSpecimens()} greet={en.greet} date={formatDateIST(DEMO_NOW, "long")} />;
  }
  const opts = { onlyHigh: onlyHigh(sp.only) };
  const copy = { hi: renderBrief(YESTERDAY_DAY, "hi", opts), en: renderBrief(YESTERDAY_DAY, "en", opts) };
  return <Brief copy={copy} />;
}
