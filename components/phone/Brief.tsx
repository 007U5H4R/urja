"use client";

import Link from "next/link";
import type { BriefCopy } from "@/lib/brief/template";
import type { Lang } from "@/lib/data/types";
import { Bars } from "@/components/charts/Bars";
import { Bricks } from "@/components/charts/Bricks";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { MobileMenu } from "@/components/shell/MobileMenu";
import { AskDock } from "@/components/ask/AskDock";
import { BriefItem } from "./BriefItem";
import { LangToggle } from "./LangToggle";
import { RichText } from "./RichText";
import { useLang } from "./useLang";

/**
 * The Morning brief (final/brief.html): the owner's phone home, Hindi first.
 * Both languages arrive rendered from lib/brief; the toggle only picks one,
 * so switching needs no round trip. Devanagari sits under `lang="hi"` (on
 * <main> and the dock), which is what selects Anek Devanagari.
 */
export function Brief({ copy }: { copy: Record<Lang, BriefCopy> }) {
  const [lang, setLang] = useLang(copy);
  const c = copy[lang];
  const last = c.earned.series.values.length - 1;
  return (
    <div className="p-brief">
      <main className="m" lang={lang}>
        <h1 className="sr">{c.heading}</h1>
        <div className="m-top">
          <span className="wordmark">
            <span className="mark">
              <svg viewBox="0 0 26 26" aria-hidden="true">
                <use href="#i-mark" />
              </svg>
            </span>
            Urja
          </span>
          {/* EXE12: no global top bar here; the screen's own bar carries the menu, in the screen's language (EXE23). */}
          <div className="m-top-end" lang="en">
            <LangToggle lang={lang} onChange={setLang} />
            <MobileMenu lang={lang} />
          </div>
        </div>

        <p className="greet">{c.greet}</p>
        <p className="date">{c.date}</p>

        <section className="panel earned">
          <p className="lbl">
            <span>{c.earned.label}</span>
            <span>{c.earned.span}</span>
          </p>
          {/* aria-live on the two figures only (Design.md §17), not the whole card */}
          <p className="big" aria-live="polite">
            <Money inr={c.earned.inr} />
          </p>
          <Bars
            uid="days"
            label={c.earned.chartLabel}
            values={c.earned.series.values}
            max={c.earned.series.max}
            stripes
            kind={(i) => (i === last ? "hot" : "dim")}
          />
          <p className="leak">
            {c.leak.clean ? (
              <span aria-live="polite">{c.leak.text}</span>
            ) : (
              <>
                <span aria-live="polite">
                  <Money lit="loss" inr={c.leak.inr} />
                </span>{" "}
                <span>{c.leak.text}</span>
              </>
            )}
          </p>
        </section>

        <section className="m-sec">
          <h2>{c.itemsHead}</h2>
          {c.filter && (
            <p className="filter">
              <span>{c.filter.text}</span>
              <Link href={c.filter.href}>{c.filter.showAll}</Link>
            </p>
          )}
          {c.items.map((item, i) => (
            <BriefItem key={item.tripId + item.text} item={item} lang={lang} first={i === 0} />
          ))}
          {c.clean && (
            <p className="clean">
              <Icon name="check" />
              <span>
                <RichText text={c.clean} />
              </span>
            </p>
          )}
        </section>

        <section className="panel monthcard" aria-label={c.month.ariaLabel}>
          <div className="two">
            <div>
              <p className="k">{c.month.flaggedLabel}</p>
              <Money as="p" className="v" inr={c.month.flaggedInr} />
            </div>
            <div>
              <p className="k">{c.month.recoveredLabel}</p>
              <Money as="p" className="v" lit inr={c.month.recoveredInr} />
            </div>
          </div>
          <Bricks
            uid="weeks"
            label={c.month.weeksLabel}
            cols={c.month.weeks.map((w) => ({ n: w.total, lit: w.lit }))}
            labels={c.month.weeks.map((w) => w.label)}
          />
          <p className="cap">{c.month.cap}</p>
        </section>
      </main>

      <AskDock lang={lang} copy={c.ask} />
    </div>
  );
}
