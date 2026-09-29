import { redirect } from "next/navigation";
import { topFlaggedTripId } from "@/lib/data/views/trip";

/** /trips has no list of its own (technical-plan §3.2): it lands on the top flagged trip (307). */
export default function TripsIndex() {
  redirect(`/trips/${topFlaggedTripId()}`);
}
