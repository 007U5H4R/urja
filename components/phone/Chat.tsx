"use client";

import Link from "next/link";
import type { MessageCopy } from "@/lib/brief/template";
import type { Lang } from "@/lib/data/types";
import { MobileMenu } from "@/components/shell/MobileMenu";
import { Icon } from "@/components/ui/Icon";
import { LangToggle } from "./LangToggle";
import { PreviewCard } from "./PreviewCard";
import { RichText } from "./RichText";
import { useLang } from "./useLang";

/**
 * The 7 AM WhatsApp message (final/message.html): the preview card, the
 * day's three flags, the link to the brief and the quick replies (§5.5).
 * The .chat column is the page's <main>, so its `lang` follows the toggle.
 */
export function Chat({ copy, host }: { copy: Record<Lang, MessageCopy>; host: string }) {
  const [lang, setLang] = useLang(copy);
  const c = copy[lang];
  return (
    <main className="chat p-message" lang={lang}>
      <h1 className="sr">{c.heading}</h1>
      <div className="chat-top">
        <span className="mark" aria-hidden="true">
          <svg viewBox="0 0 26 26">
            <use href="#i-mark" />
          </svg>
        </span>
        <div>
          <b>Urja</b>
          <small>{c.account}</small>
        </div>
        {/* EXE12: no global top bar here; the chat header carries the menu, in the screen's language (EXE23). */}
        <div className="m-top-end" lang="en">
          <LangToggle lang={lang} onChange={setLang} />
          <MobileMenu lang={lang} />
        </div>
      </div>

      <div className="thread">
        <span className="day">{c.day}</span>
        <div className="bubble">
          <PreviewCard href={c.briefHref} label={c.open} preview={c.preview} host={host} />
          <div className="txt">
            <h3>{c.headline}</h3>
            <p>{c.intro}</p>
            {c.items.length > 0 && (
              <ol>
                {c.items.map((item, i) => (
                  <li key={i}>
                    <RichText text={item} />
                  </li>
                ))}
              </ol>
            )}
            {c.clean && <p>{c.clean}</p>}
            <p className="meta">{c.time}</p>
          </div>
          <Link className="act" href={c.briefHref}>
            <span>{c.open}</span>
            <Icon name="right" />
          </Link>
        </div>
        <div className="replies">
          {c.replies.map((r) => (
            // A reply to a trip page crosses into the site's root layout (EXE23): a full page load,
            // so it isn't prefetched. The brief's own links stay within the phone screens.
            <Link key={r.href} href={r.href} prefetch={r.href.startsWith("/brief") ? undefined : false}>
              {r.text}
            </Link>
          ))}
        </div>
      </div>
      <p className="caption">{c.caption}</p>
    </main>
  );
}
