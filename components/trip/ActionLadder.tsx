import type { Tier } from "@/content/bet/ladder";
import { FLAG_LAB_COPY as C } from "@/content/bet/flag-lab-copy";
import type { LadderActionView, LadderLevelCell, LadderLevelMeta } from "@/lib/bet/ladder";
import type { FlagLabView } from "@/lib/bet/views/flag-lab";

export interface ActionLadderProps {
  tiers: FlagLabView["tiers"];
  tier: Tier;
  onTier: (tier: Tier) => void;
  levels: readonly LadderLevelMeta[];
  /** `flag.matrix[step][tier]`, lined up with `levels`. */
  cells: readonly LadderLevelCell[];
  /** The prototype note after an action, shown in the level it came from. */
  note: { level: string; text: string } | null;
  onAction: (level: string, label: string) => void;
}

function Action({ a, describedBy, onAction }: { a: LadderActionView; describedBy: string; onAction: () => void }) {
  const ready = a.state === "available";
  return (
    <li className="fl-act" data-state={a.state}>
      {a.id === "ask-driver" && ready ? (
        // The flag card already asks the driver; the lab points there instead of a second Ask button.
        <a className="btn btn-line fl-btn" href="#driver" aria-describedby={describedBy}>
          {a.label}
        </a>
      ) : (
        <button type="button" className="btn btn-line fl-btn" disabled={!ready} aria-describedby={describedBy} onClick={onAction}>
          {a.label}
        </button>
      )}
      <p className="fl-reason" id={describedBy}>
        {C.actionState[a.state] && <span className="fl-astate">{C.actionState[a.state]}</span>}
        {a.reason}
      </p>
    </li>
  );
}

/**
 * The autonomy ladder × tiers (TASK-25; bet-spec §7): a tier switch, then L1–L5 with what each
 * level may do for this flag at the chosen stream step. Locked actions are disabled and say why;
 * an available one shows the prototype note and sends nothing. Rendered inside the client <FlagLab>.
 */
export function ActionLadder({ tiers, tier, onTier, levels, cells, note, onAction }: ActionLadderProps) {
  return (
    <section className="fl-col fl-ladder" aria-labelledby="fl-ladder-h">
      <h3 id="fl-ladder-h" className="fl-h3">
        {C.ladder.heading}
      </h3>
      <div className="fl-tier">
        <span id="fl-tier-l" className="fl-ctl-l">
          {C.ladder.control}
        </span>
        <div className="seg" role="group" aria-labelledby="fl-tier-l">
          {tiers.map((t) => (
            <button key={t.id} type="button" aria-pressed={t.id === tier} onClick={() => onTier(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <ol className="fl-levels">
        {levels.map((l, k) => {
          const cell = cells[k];
          const future = l.tier === null;
          const lock = future ? C.lock.future : cell.unlocked ? C.lock.unlocked : C.lock.locked;
          return (
            <li key={l.id} data-level={l.id} data-unlocked={cell.unlocked} data-future={future || undefined}>
              <div className="fl-level-head">
                <h4>{l.title}</h4>
                {/* The future level has no tier; its lock chip already says Future. */}
                {!future && <span className="fl-tierlabel">{l.tierLabel}</span>}
                <span className={cell.unlocked ? "chip moving fl-lock" : "chip fl-lock"}>{lock}</span>
              </div>
              {cell.note && <p className="fl-level-note">{cell.note}</p>}
              {cell.actions.length === 0 && !cell.note && <p className="fl-level-note">{l.summary}</p>}
              {cell.actions.length > 0 && (
                <ul className="fl-acts">
                  {cell.actions.map((a) => (
                    <Action key={a.id} a={a} describedBy={`fl-${l.id}-${a.id}`} onAction={() => onAction(l.id, a.label)} />
                  ))}
                </ul>
              )}
              <p className="fl-note" aria-live="polite" data-testid="fl-note">
                {note?.level === l.id ? note.text : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
