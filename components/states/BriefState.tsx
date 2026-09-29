import type { ReactNode } from "react";
import { MobileMenu } from "@/components/shell/MobileMenu";
import type { StateSpecimens } from "@/lib/data/views/states";
import type { ScreenState } from "@/lib/state";
import { CleanSpecimenCard, EmptySpecimenCard, ErrorSpecimenCard, LoadingSpecimenCard } from "./Specimens";
import "./states.css";

/**
 * The Morning brief in one of its states: the phone screen's own bar, the
 * greeting and the state card in place of the brief. The specimens are English
 * (final/states.html), so the screen is too.
 */
export function BriefState({ state, s, greet, date }: { state: ScreenState; s: StateSpecimens; greet: string; date: string }) {
  const card: Record<ScreenState, ReactNode> = {
    loading: <LoadingSpecimenCard s={s.loading} />,
    empty: <EmptySpecimenCard s={s.empty} />,
    clean: <CleanSpecimenCard s={s.clean} />,
    error: <ErrorSpecimenCard s={s.error} />,
  };
  return (
    <div className="p-brief">
      <main className="m st-view" lang="en">
        <div className="m-top">
          <span className="wordmark">
            <span className="mark">
              <svg viewBox="0 0 26 26" aria-hidden="true">
                <use href="#i-mark" />
              </svg>
            </span>
            Urja
          </span>
          <div className="m-top-end">
            <MobileMenu />
          </div>
        </div>
        <p className="greet">{greet}</p>
        <p className="date">{date}</p>
        <div className="states mt-5">{card[state]}</div>
      </main>
    </div>
  );
}
