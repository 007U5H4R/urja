import type { MetricTile } from "@/content/why";

/** Chapter 05's two tiles (final/why.html lines 224–235): the North Star, lit, and the guardrail. */
export function Metrics({ tiles }: { tiles: readonly MetricTile[] }) {
  return (
    <div className="tiles">
      {tiles.map((t) => (
        <article key={t.label} className={t.lit ? "panel tile lit" : "panel tile"} aria-label={t.ariaLabel}>
          <p className="k">{t.label}</p>
          <p className="big">
            <span className={t.lit ? "n lit" : "n"}>{t.value}</span>
            <span className="u">{t.unit}</span>
          </p>
          <p className="d">
            {t.lead ? (
              <>
                <b>{t.lead}</b>{" "}
              </>
            ) : null}
            {t.detail}
          </p>
        </article>
      ))}
    </div>
  );
}
