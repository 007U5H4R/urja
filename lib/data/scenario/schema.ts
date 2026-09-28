/**
 * The scenario file's schema (technical-plan §4.2), written by
 * scripts/generate-scenario.ts and read by lib/data/pipeline.ts.
 *
 * Beyond §4.2, each trip carries the physics the simulator replays:
 * `startFuelCl` (tank at departure) and `legs` (moving spans with their km
 * and the diesel burnt on them). Stops fill the gaps between legs.
 * `fuelUsedCl` is the diesel the engine burnt (Σ legs); injected drops and
 * short-filled bills are on top of it.
 * Every time is a `Min` (minutes since 2026-08-29T00:00+05:30).
 */
import { z } from "zod";

const int = z.number().int();
const nonNegInt = int.nonnegative();
const lngLat = z.tuple([z.number(), z.number()]);
const bilingual = z.strictObject({ en: z.string().min(1), hi: z.string().min(1) });

export const legSchema = z
  .strictObject({
    from: int,
    to: int,
    km: z.number().positive(),
    fuelCl: nonNegInt,
  })
  .refine((l) => l.to > l.from, { message: "leg.to must be after leg.from" });

export const stopSchema = z.strictObject({
  from: int,
  to: int,
  kind: z.enum(["dhaba", "rest", "refuel", "parked"]),
  placeId: z.string().optional(),
  lngLat: lngLat.optional(),
});

export const scenarioRefuelSchema = z.strictObject({
  t: int,
  placeId: z.string(),
  billedCl: nonNegInt,
  tankRiseCl: nonNegInt,
});

export const injectionSchema = z.discriminatedUnion("kind", [
  z
    .strictObject({ kind: z.literal("stationary-drop"), from: int, to: int, litres: z.number().positive(), lngLat })
    .refine((d) => d.to > d.from, { message: "a drop must end after it starts" }),
  z.strictObject({ kind: z.literal("refuel-short"), refuelIndex: nonNegInt, missingCl: nonNegInt }),
  z.strictObject({ kind: z.literal("excess"), litres: z.number().positive() }),
  z.strictObject({ kind: z.literal("detour"), km: z.number().positive() }),
  z.strictObject({ kind: z.literal("toll-claim"), inr: nonNegInt }),
]);

export const scenarioTripSchema = z.strictObject({
  id: z.string().regex(/^\d{4}-\d{2}$/),
  plate: z.string(),
  routeId: z.string(),
  start: int,
  end: int,
  loadT: z.number().positive(),
  cargo: bilingual,
  freightInr: nonNegInt,
  allowanceInr: nonNegInt,
  otherInr: nonNegInt,
  startFuelCl: nonNegInt,
  fuelUsedCl: nonNegInt,
  legs: z.array(legSchema).min(1),
  stops: z.array(stopSchema),
  refuels: z.array(scenarioRefuelSchema),
  tolls: z.strictObject({
    claimedInr: nonNegInt,
    plazas: z.array(z.strictObject({ placeId: z.string(), t: int, inr: nonNegInt })),
  }),
  extraKm: z.number().positive().optional(),
  /** Route-km span over which a detour leaves the planned path. */
  detour: z.strictObject({ fromKm: z.number(), toKm: z.number() }).optional(),
  injections: z.array(injectionSchema),
})
  .refine((t) => t.end > t.start, { message: "trip.end must be after trip.start" })
  .refine(
    (t) => t.injections.every((j) => j.kind !== "refuel-short" || j.refuelIndex < t.refuels.length),
    { message: "refuel-short.refuelIndex must point at one of the trip's refuels" },
  );

export const resolutionSchema = z.strictObject({
  flagId: z.string(),
  status: z.enum(["waiting", "confirmed", "wrong"]),
  driverSide: z.strictObject({
    state: z.enum(["not-asked", "replied", "cleared", "confirmed"]),
    text: bilingual.optional(),
  }),
  recoveredInr: nonNegInt,
});

export const nowSchema = z.strictObject({
  at: int,
  trucks: z.array(
    z.strictObject({
      plate: z.string(),
      state: z.enum(["moving", "yard", "workshop"]),
      label: bilingual,
      lngLat,
    }),
  ),
});

export const scenarioSchema = z.strictObject({
  version: z.literal(1),
  seed: int,
  trips: z.array(scenarioTripSchema),
  resolutions: z.array(resolutionSchema),
  now: nowSchema,
});

export type ScenarioLeg = z.infer<typeof legSchema>;
export type ScenarioStop = z.infer<typeof stopSchema>;
export type ScenarioRefuel = z.infer<typeof scenarioRefuelSchema>;
export type Injection = z.infer<typeof injectionSchema>;
export type ScenarioTrip = z.infer<typeof scenarioTripSchema>;
export type Resolution = z.infer<typeof resolutionSchema>;
export type ScenarioNow = z.infer<typeof nowSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
