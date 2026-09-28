import { Bars } from "@/components/charts/Bars";
import { Bricks } from "@/components/charts/Bricks";
import { Meter } from "@/components/charts/Meter";
import { Units } from "@/components/charts/Units";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import { SectionHead } from "@/components/ui/SectionHead";
import type { KpiFooter, SeptemberKpis } from "@/lib/data/views/today";

function Footer({ parts }: { parts: KpiFooter }) {
  return (
    <footer>
      {parts.map((p, i) => (
        <span key={i}>
          {p.text}
          {p.bold != null && <b className={p.boldTone}>{p.bold}</b>}
          {p.after}
        </span>
      ))}
    </footer>
  );
}

/**
 * "September so far" (final/index.html lines 105–135, chart calls on 249–258):
 * four KPI chart cards. Every number, chart series, footer and aria-label comes
 * from the view model.
 */
export function KpiCards({ september: s }: { september: SeptemberKpis }) {
  const { diesel, recovered, wrong, perKm } = s;
  return (
    <section className="sec" aria-labelledby="month-h" style={{ paddingTop: 28 }}>
      <SectionHead id="month-h" title={`${s.month} so far`} count={`${s.range} · ${s.trips} trips`} />
      <div className="kpis">
        <article className="panel kpi">
          <header>
            <Icon name="fuel" />
            <h3>Diesel unaccounted</h3>
          </header>
          <div className="vrow">
            <p className="v">
              {diesel.litres}
              <small>L</small>
            </p>
            <span className="delta">+{diesel.lastWeekL} L this week</span>
          </div>
          <Bars
            uid="kpi-diesel"
            label={diesel.ariaLabel}
            values={diesel.chart.values}
            kind={diesel.chart.kinds}
            max={diesel.chart.max}
            labels={diesel.chart.labels}
            bracket={diesel.chart.bracket}
            stripes
          />
          <Footer parts={diesel.footer} />
        </article>

        <article className="panel kpi">
          <header>
            <Icon name="rupee" />
            <h3>Recovered</h3>
          </header>
          <div className="vrow">
            <Money as="p" className="v" inr={recovered.inr} />
            <span className="delta gain">{recovered.sharePct}% of flagged</span>
          </div>
          <Bricks
            uid="kpi-caught"
            label={recovered.ariaLabel}
            cols={recovered.weeks.map((w) => ({ n: w.bricks.total, lit: w.bricks.lit }))}
            labels={recovered.weeks.map((w) => w.label)}
          />
          <Footer parts={recovered.footer} />
        </article>

        <article className="panel kpi">
          <header>
            <Icon name="shield" />
            <h3>When Urja was wrong</h3>
          </header>
          <div className="vrow">
            <p className="v">
              {wrong.count}
              <small>of {wrong.of} flags</small>
            </p>
            <span className={wrong.underLimit ? "delta gain" : "delta loss"}>
              {wrong.pct}% · limit {wrong.limitPct}%
            </span>
          </div>
          <Units uid="kpi-wrong" label={wrong.ariaLabel} groups={wrong.groups} perRow={12} h={34} style={{ height: "auto" }} />
          <Meter value={wrong.meter.value} limit={wrong.meter.limit} max={wrong.meter.max} labels={wrong.meter.labels} />
          <Footer parts={wrong.footer} />
        </article>

        <article className="panel kpi">
          <header>
            <Icon name="gauge" />
            <h3>Profit per km · {perKm.values.length} trucks</h3>
          </header>
          <div className="vrow">
            <p className="v">
              {perKm.best.perKmText}
              <small>best</small>
            </p>
            <Plate plate={perKm.best.plate} />
          </div>
          <Bars
            uid="kpi-perkm"
            label={perKm.ariaLabel}
            values={perKm.chart.values}
            kind={perKm.chart.kinds}
            max={perKm.chart.max}
            labels={perKm.chart.labels}
          />
          <Footer parts={perKm.footer} />
        </article>
      </div>
    </section>
  );
}
