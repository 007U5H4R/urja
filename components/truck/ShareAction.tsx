"use client";

import { useId, useState } from "react";
import { SimulatedTag } from "@/components/bet/SimulatedTag";

export interface ShareActionProps {
  button: string;
  stepHead: string;
  steps: readonly string[];
  /** PROTOTYPE_NOTE. */
  note: string;
  sent: string;
}

/**
 * "Share with a lending partner": an honest prototype action. It opens the consent step the owner
 * would go through first and says plainly that nothing was sent. No request is made.
 */
export function ShareAction({ button, stepHead, steps, note, sent }: ShareActionProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="tk-share">
      <button type="button" className="btn btn-lamp" aria-expanded={open} aria-controls={`${id}-step`} onClick={() => setOpen((o) => !o)}>
        {button}
      </button>
      <div id={`${id}-step`} className="tk-consent" role="group" aria-labelledby={`${id}-h`} hidden={!open}>
        <h3 id={`${id}-h`}>{stepHead}</h3>
        <ol>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <p className="tk-share-note" role="status">
        {open && (
          <>
            <SimulatedTag>{note}</SimulatedTag> <span>{sent}</span>
          </>
        )}
      </p>
    </div>
  );
}
