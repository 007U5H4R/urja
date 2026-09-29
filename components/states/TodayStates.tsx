import type { ReactNode } from "react";
import type { StateSpecimens } from "@/lib/data/views/states";
import type { ScreenState } from "@/lib/state";
import { CleanSpecimenCard, EmptySpecimenCard, ErrorSpecimenCard, LoadingSpecimenCard } from "./Specimens";
import { StateView } from "./StateCard";

/** The four specimens as Today renders them: the greeting, then the state in place of the page. */
export function todaySpecimens(greet: string, s: StateSpecimens): Record<ScreenState, ReactNode> {
  return {
    loading: (
      <StateView greet={greet}>
        <LoadingSpecimenCard s={s.loading} />
      </StateView>
    ),
    empty: (
      <StateView greet={greet}>
        <EmptySpecimenCard s={s.empty} />
      </StateView>
    ),
    clean: (
      <StateView greet={greet}>
        <CleanSpecimenCard s={s.clean} />
      </StateView>
    ),
    error: (
      <StateView greet={greet}>
        <ErrorSpecimenCard s={s.error} />
      </StateView>
    ),
  };
}
