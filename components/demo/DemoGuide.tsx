import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { DEMO_COPY, type DemoView } from "@/content/demo";

/**
 * /demo (TASK-33, EXE49): the guided path "Start the demo" opens. A page head, then six numbered
 * steps, each a panel with a title, one line on what to look at, and a link. Lamp.css classes
 * (.wrap, .pagehead, .verdict, .panel, .btn) plus components/demo/demo.css.
 */
export function DemoGuide({ view }: { view: DemoView }) {
  return (
    <main className="wrap demo" id="main">
      <section className="pagehead" aria-labelledby="h1">
        <div>
          <h1 className="verdict" id="h1">
            {DEMO_COPY.h1}
          </h1>
          <p className="demo-intro">{view.intro}</p>
        </div>
      </section>
      <ol className="demo-steps" aria-label={DEMO_COPY.stepsLabel}>
        {view.steps.map((s, i) => {
          const id = `step-${i + 1}`;
          return (
            <li key={s.href} className="panel" aria-labelledby={id}>
              <span className="demo-n" aria-hidden="true">
                {i + 1}
              </span>
              <div className="demo-body">
                <h2 id={id}>{s.title}</h2>
                <p>{s.look}</p>
              </div>
              {/* The message is another root layout (EXE23): a full page load, so no prefetch. */}
              <Link className={`btn ${i === 0 ? "btn-lamp" : "btn-line"}`} href={s.href} prefetch={s.crossLayout ? false : undefined}>
                {s.cta}
                <Icon name="right" />
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
