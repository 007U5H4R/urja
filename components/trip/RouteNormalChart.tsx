import { Bars } from "@/components/charts/Bars";
import type { RouteNormalView } from "@/lib/data/views/trip";

/** final/trip.html lines 125–128: this route's recent trips, dim, with this trip lit and the normal dashed. */
export function RouteNormalChart({ normal }: { normal: RouteNormalView }) {
  if (normal.kind === "none") {
    return (
      <div className="routechart">
        <p>
          <span>{normal.text}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="routechart">
      <p>
        <span>{normal.caption}</span>
        <span>{normal.refText}</span>
      </p>
      <Bars uid="croute" label={normal.label} values={normal.values} kind={normal.kinds} max={normal.max} refLine={{ v: normal.normalInr }} />
    </div>
  );
}
