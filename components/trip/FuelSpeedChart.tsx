import type { CSSProperties } from "react";
import { Wave, type WaveNote } from "@/components/charts/Wave";
import { Money } from "@/components/ui/Money";
import type { ChartView, WaveSeries } from "@/lib/data/views/trip";

/** The legend swatches, as final/trip.html line 94 draws them. */
const SWATCH: Record<ChartView["legend"][number]["swatch"], CSSProperties> = {
  fuel: { background: "oklch(0.52 0.008 60)" },
  loss: { background: "var(--loss)" },
  refuel: { background: "var(--cream)" },
  dash: { width: 16, height: 0, borderTop: "2px dashed var(--cream)", borderRadius: 0 },
};

function notes(s: WaveSeries): WaveNote[] {
  return s.notes.map((n) => ({
    i: n.i,
    y: n.y,
    a: n.a,
    text: n.text,
    fs: n.fs,
    ...(n.tone === "loss" ? { c: "var(--loss)", w: 600 } : {}),
  }));
}

function Series({ s, label, className, uid }: { s: WaveSeries; label: string; className: string; uid: string }) {
  return (
    <Wave
      className={className}
      label={label}
      uid={uid}
      fuel={s.fuel}
      speed={s.speed}
      kind={s.kind}
      window={s.window}
      expected={s.expected}
      notes={notes(s)}
      times={s.times}
      max={s.max}
      ticks={s.ticks}
      w={s.w}
      h={s.h}
      gap={s.gap}
      fs={s.fs}
    />
  );
}

/**
 * final/trip.html lines 92–98 and 139–153: fuel in the tank above the axis,
 * speed mirrored below; a desktop series and a phone series (CSS shows one).
 * R5 swaps the chart note for a claims vs FASTag table (technical-plan §5.4).
 */
export function FuelSpeedChart({ chart }: { chart: ChartView }) {
  return (
    <section className="panel chartpanel" aria-labelledby="fuel-h">
      <div className="sec-head">
        <h2 id="fuel-h">Fuel in the tank, and speed</h2>
        <span className="count">{chart.count}</span>
        <span className="right legend" aria-hidden="true">
          {chart.legend.map((l) => (
            <span key={l.text}>
              <i style={SWATCH[l.swatch]}></i>
              {l.text}
            </span>
          ))}
        </span>
      </div>
      <Series s={chart.desk} label={chart.label} className="wave-desk" uid="wave" />
      <Series s={chart.phone} label={chart.phoneLabel} className="wave-mob" uid="waveM" />
      {chart.note && <p className="note">{chart.note}</p>}
      {chart.tolls && (
        <div className="tolls">
          <table className="tbl">
            <caption className="note">Toll claim against FASTag deductions, plaza by plaza</caption>
            <thead>
              <tr>
                <th scope="col">Plaza</th>
                <th scope="col">Time</th>
                <th scope="col" className="r">
                  FASTag
                </th>
              </tr>
            </thead>
            <tbody>
              {chart.tolls.rows.map((r) => (
                <tr key={`${r.plaza}-${r.time}`}>
                  <td>{r.plaza}</td>
                  <td>{r.time}</td>
                  <td className="r">
                    <Money inr={r.inr} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>FASTag total</td>
                <td className="r">
                  <Money inr={chart.tolls.fastagInr} />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>Claimed by the driver</td>
                <td className="r">
                  <Money inr={chart.tolls.claimedInr} />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>Doesn’t add up</td>
                <td className="r">
                  <Money inr={chart.tolls.diffInr} tone="loss" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
