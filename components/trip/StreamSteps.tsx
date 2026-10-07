import { SimulatedTag } from "@/components/bet/SimulatedTag";
import { FLAG_LAB_COPY as C } from "@/content/bet/flag-lab-copy";
import type { StreamLevel } from "@/content/bet/streams";
import type { FlagLabFlagView } from "@/lib/bet/views/flag-lab";

/** The confidence meter's lit bars (lamp.css `.conf`): shape plus the view's word, never colour alone. */
const BARS: Record<StreamLevel, 1 | 2 | 3> = { check: 1, likely: 2, high: 3 };

function Level({ level, word }: { level: StreamLevel; word: string }) {
  return (
    <span className="conf" data-level={BARS[level]}>
      <i aria-hidden="true">
        <b></b>
        <b></b>
        <b></b>
      </i>
      {word}
    </span>
  );
}

export interface StreamStepsProps {
  flag: FlagLabFlagView;
  /** The chosen step, 0-based. */
  step: number;
  onStep: (step: number) => void;
  familiesNote: string;
}

/**
 * The cumulative stream ladder (TASK-25): a native range adds streams one at a time; the steps
 * up to it are added, the rest wait, dimmed and saying so. Confidence and the independent
 * families at the chosen step lead the column. Rendered inside the client <FlagLab>.
 */
export function StreamSteps({ flag, step, onStep, familiesNote }: StreamStepsProps) {
  const total = flag.steps.length;
  const cur = flag.steps[step];
  return (
    <section className="fl-col fl-steps" aria-labelledby="fl-steps-h">
      <h3 id="fl-steps-h" className="fl-h3">
        {C.steps.heading}
      </h3>
      <div className="fl-now" data-testid="fl-now">
        <span className="fl-now-k">{C.steps.now}</span>
        <Level level={cur.level} word={cur.levelWord} />
        <span className="fl-now-fam">{cur.familiesText}</span>
      </div>
      <div className="fl-stepper">
        <label htmlFor="fl-step">{C.steps.control}</label>
        <input
          id="fl-step"
          type="range"
          min={1}
          max={total}
          step={1}
          value={step + 1}
          aria-valuetext={C.stepValueText(step + 1, total, cur.label, cur.levelWord)}
          onChange={(e) => onStep(Number(e.currentTarget.value) - 1)}
        />
        <span className="fl-stepcount" aria-hidden="true">
          {C.stepCount(step + 1, total)}
        </span>
      </div>
      <ol className="fl-steplist">
        {flag.steps.map((s) => {
          const state = s.index < step ? "added" : s.index === step ? "current" : "later";
          const later = state === "later";
          return (
            <li key={s.streamId} data-state={state}>
              <span className="fl-n" aria-hidden="true">
                {s.index + 1}
              </span>
              <div className="fl-step-body">
                <div className="fl-step-head">
                  <b className="fl-step-label">{s.label}</b>
                  {s.simulated && <SimulatedTag>{s.simulatedTag}</SimulatedTag>}
                  <span className="fl-step-state">{later ? C.stepState.later : <Level level={s.level} word={s.levelWord} />}</span>
                </div>
                <p className="fl-step-meta">
                  {s.source}
                  {!later && <> · {s.familiesText}</>}
                </p>
                {!later && s.countNote && <p className="fl-countnote">{s.countNote}</p>}
                <p className="fl-step-note">{s.note}</p>
                {!later && s.evidence.length > 0 && (
                  <ul className="fl-ev">
                    {s.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="fl-families">
        <b>{C.steps.familiesTitle}.</b> {familiesNote}
      </p>
    </section>
  );
}
