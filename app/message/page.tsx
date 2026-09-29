import type { Metadata } from "next";
import { Chat } from "@/components/phone/Chat";
import { YESTERDAY_DAY } from "@/lib/data/aggregates";
import { langParam } from "@/lib/brief/dict";
import { renderMessage } from "@/lib/brief/template";
import { siteHost } from "@/lib/site";
import "@/components/phone/phone.css";

// TKT-06 (TSK-06.3): final/message.html. The preview card shows this deployment's
// host (lib/site.ts, §4.9), and `?lang=` is read on the server like /brief.
type Search = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const lang = langParam((await searchParams).lang);
  return { title: { absolute: renderMessage(YESTERDAY_DAY, lang).title } };
}

export default async function MessagePage({ searchParams }: Search) {
  // Reading the params renders per request, so the client's useSearchParams sees ?lang= on first paint.
  await searchParams;
  const copy = { hi: renderMessage(YESTERDAY_DAY, "hi"), en: renderMessage(YESTERDAY_DAY, "en") };
  return <Chat copy={copy} host={siteHost} />;
}
