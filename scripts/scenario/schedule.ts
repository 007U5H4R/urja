/**
 * Scheduling for the scenario generator (§4.7 step 1).
 *
 * Trips come in blocks that start and end at the Jaipur yard: an out-and-back
 * pair, a Kishangarh pair, or a single local run. A terminal block may end
 * elsewhere (a truck parked at Okhla or Bhiwandi) or still be on the road at
 * DEMO_NOW. Anchored blocks are pinned first; filler blocks then fill each
 * truck's free time at the yard.
 */
import { DEMO_NOW, dayKey, istMin } from "@/lib/clock";
import { routeById } from "@/lib/data/routes";
import { type Plan, type PlanInput, planTrip, type Rng, uni } from "./plan";

export const SEP = (d: number, h = 0, m = 0) => istMin(2026, 9, d, h, m);
export const SEPT_START = SEP(1);
/** Filler trips end before 27 Sep: 24 and 27 Sep carry exactly their anchored trips. */
export const FILLER_END_BEFORE = SEP(27);
export const YARD_GAP_MIN = 90;

/** The September day a minute falls on (IST); 0 before September, 99 after. */
export function septDay(t: number): number {
  const k = dayKey(t);
  if (k < "2026-09-01") return 0;
  if (k > "2026-09-30") return 99;
  return Number(k.slice(8, 10));
}

export type Role = "anchor" | "rn" | "flag" | "free";

export interface Slot {
  key: string;
  plan: Plan;
  role: Role;
  anchorId?: string;
  flagRef?: string;
  rnIndex?: number;
  endDay?: number;
  /** The trip must end on or before this September day. */
  endByDay?: number;
  startDay?: number;
  fixedStart?: number;
  inProgress?: boolean;
  /** The one local run whose km closes a truck's September km. */
  kmBalancer?: boolean;
  start: number;
  plate: string;
  id: string;
  freightInr: number;
  allowanceInr: number;
  otherInr: number;
}

export interface TripSpec {
  routeId: string;
  role?: Role;
  anchorId?: string;
  flagRef?: string;
  rnIndex?: number;
  endDay?: number;
  endByDay?: number;
  startDay?: number;
  fixedStart?: number;
  inProgress?: boolean;
  kmBalancer?: boolean;
  /** Plan options for a given plate. */
  plan?: (plate: string, rng: Rng) => Partial<PlanInput>;
  /** A fully specified plan (the 0926-04 anchor), bypassing the planner. */
  fixedPlan?: (plate: string) => Plan;
}

export interface BlockSpec {
  name: string;
  trips: TripSpec[];
  /** A fixed plate, or a pool to choose from. */
  plate?: string;
  pool?: readonly string[];
  terminal?: boolean;
  /** Earliest block start (e.g. after the truck is free). */
  notBefore?: number;
}

export interface Block {
  name: string;
  plate: string;
  slots: Slot[];
  start: number;
  end: number;
  terminal: boolean;
  filler: boolean;
  /** The trip specs a filler block was made from (to re-time it). */
  specs?: TripSpec[];
}

export const endsAtYard = (routeId: string) => routeById(routeId).to === "jaipur-tn";

let slotSeq = 0;
function makeSlot(spec: TripSpec, plate: string, rng: Rng): Slot {
  const input: PlanInput = { plate, routeId: spec.routeId, ...(spec.plan ? spec.plan(plate, rng) : {}) };
  return {
    key: `s${++slotSeq}`,
    plan: spec.fixedPlan ? spec.fixedPlan(plate) : planTrip(rng, input),
    role: spec.role ?? "free",
    anchorId: spec.anchorId,
    flagRef: spec.flagRef,
    rnIndex: spec.rnIndex,
    endDay: spec.endDay,
    endByDay: spec.endByDay,
    startDay: spec.startDay,
    fixedStart: spec.fixedStart,
    inProgress: spec.inProgress,
    kmBalancer: spec.kmBalancer,
    start: 0,
    plate,
    id: "",
    freightInr: 0,
    allowanceInr: 0,
    otherInr: 0,
  };
}

/** Whether a placed trip honours its own constraints and the global ones. */
export function slotOk(s: Slot, start: number): boolean {
  const end = start + s.plan.dur;
  if (s.inProgress) return start <= DEMO_NOW - 60 && end > DEMO_NOW + 30;
  if (end > FILLER_END_BEFORE + 1440 || (end >= SEP(28) && end <= DEMO_NOW + 30)) return false;
  if (s.fixedStart !== undefined) return start === s.fixedStart;
  if (s.startDay !== undefined && septDay(start) !== s.startDay) return false;
  if (s.endDay !== undefined) return septDay(end) === s.endDay;
  const d = septDay(end);
  if (d === 24 || d === 27 || d > 27) return false;
  if (s.plan.routeId === "JAI-OKH" && s.role !== "rn" && s.role !== "flag" && d >= 13) return false;
  if (s.kmBalancer && (d < 1 || d > 13)) return false;
  if (s.endByDay !== undefined && (d < 1 || d > s.endByDay)) return false;
  return true;
}

function dwellAfter(rng: Rng, s: Slot): number {
  return Math.round(endsAtYard(s.plan.routeId) ? uni(rng, YARD_GAP_MIN, 300) : uni(rng, 180, 540));
}

/** Tries to time a block's trips (random dwells, and a random start inside the constraints). */
export function timeBlock(rng: Rng, slots: Slot[], notBefore = 0, tries = 300): number[] | null {
  for (let k = 0; k < tries; k++) {
    const dwell = slots.map((s) => dwellAfter(rng, s));
    const offset: number[] = [];
    let o = 0;
    slots.forEach((s, i) => {
      offset.push(o);
      o += s.plan.dur + dwell[i];
    });
    let start: number | null = null;
    const fixed = slots.findIndex((s) => s.fixedStart !== undefined);
    if (fixed >= 0) start = slots[fixed].fixedStart! - offset[fixed];
    else {
      const c = slots.findIndex((s) => s.endDay !== undefined || s.startDay !== undefined || s.inProgress);
      if (c < 0) return null;
      const s = slots[c];
      let lo: number;
      let hi: number;
      if (s.inProgress) {
        lo = DEMO_NOW + 30 - s.plan.dur;
        hi = DEMO_NOW - 60;
      } else if (s.endDay !== undefined) {
        lo = SEP(s.endDay) - s.plan.dur;
        hi = SEP(s.endDay + 1) - 1 - s.plan.dur;
      } else {
        lo = SEP(s.startDay!);
        hi = SEP(s.startDay! + 1) - 1;
      }
      if (hi < lo) continue;
      start = Math.round(uni(rng, lo, hi)) - offset[c];
    }
    if (start < notBefore) continue;
    const starts = offset.map((x) => start! + x);
    if (slots.every((s, i) => slotOk(s, starts[i]))) return starts;
  }
  return null;
}

export class Schedule {
  blocks: Block[] = [];

  constructor(readonly rng: Rng) {}

  byPlate(plate: string): Block[] {
    return this.blocks.filter((b) => b.plate === plate).sort((a, b) => a.start - b.start);
  }

  fits(plate: string, start: number, end: number, terminal: boolean): boolean {
    for (const b of this.byPlate(plate)) {
      if (b.terminal && end + YARD_GAP_MIN > b.start) return false;
      if (terminal && b.end + YARD_GAP_MIN > start) return false;
      if (!(end + YARD_GAP_MIN <= b.start || b.end + YARD_GAP_MIN <= start)) return false;
    }
    return true;
  }

  /** Plans, times and assigns a block; returns null when no truck in its pool can take it. */
  pin(spec: BlockSpec, accept?: (plate: string, slots: Slot[]) => boolean, rank?: (plate: string) => number): Block | null {
    let plates = spec.plate ? [spec.plate] : shuffle(this.rng, [...(spec.pool ?? [])]);
    if (rank) plates = plates.map((p) => ({ p, r: rank(p) })).sort((a, b) => a.r - b.r).map((x) => x.p);
    for (const plate of plates) {
      const slots = spec.trips.map((t) => makeSlot(t, plate, this.rng));
      for (let k = 0; k < 6; k++) {
        const starts = timeBlock(this.rng, slots, spec.notBefore ?? 0, 120);
        if (!starts) continue;
        const end = starts[starts.length - 1] + slots[slots.length - 1].plan.dur;
        if (!this.fits(plate, starts[0], end, spec.terminal ?? false)) continue;
        if (accept && !accept(plate, slots)) break;
        slots.forEach((s, i) => (s.start = starts[i]));
        const block: Block = { name: spec.name, plate, slots, start: starts[0], end, terminal: spec.terminal ?? false, filler: false };
        this.blocks.push(block);
        return block;
      }
    }
    return null;
  }

  /** Free spans at the Jaipur yard for a truck: [earliest start, latest end]. */
  windows(plate: string, from: number, to: number): [number, number][] {
    const out: [number, number][] = [];
    let cursor = from;
    for (const b of this.byPlate(plate)) {
      if (b.start - YARD_GAP_MIN > cursor) out.push([cursor, Math.min(to, b.start - YARD_GAP_MIN)]);
      cursor = Math.max(cursor, b.end + YARD_GAP_MIN);
      if (b.terminal) return out.filter(([a, z]) => z > a);
    }
    if (to > cursor) out.push([cursor, to]);
    return out.filter(([a, z]) => z > a);
  }

  /**
   * Places filler blocks (each a list of trip specs) into a truck's free
   * windows between `from` and `to`. Returns false (and adds nothing) when
   * they do not fit.
   */
  fill(plate: string, specs: TripSpec[][], from: number, to: number, tries = 60): boolean {
    const blocks = specs.map((trips) => trips.map((t) => makeSlot(t, plate, this.rng)));
    const spanOf = (slots: Slot[]) => slots.reduce((a, s) => a + s.plan.dur, 0) + (slots.length - 1) * 360;
    const wins = this.windows(plate, from, to);
    for (let k = 0; k < tries; k++) {
      const order = shuffle(this.rng, blocks.map((_, i) => i));
      // The km balancer goes first, into a window that opens before 13 Sep.
      order.sort((a, b) => Number(blocks[b].some((s) => s.kmBalancer)) - Number(blocks[a].some((s) => s.kmBalancer)));
      const cap = wins.map(([a, z]) => z - a);
      const assign: number[][] = wins.map(() => []);
      let ok = true;
      for (const i of order) {
        const need = spanOf(blocks[i]) + 2 * YARD_GAP_MIN;
        const early = blocks[i].some((s) => s.kmBalancer || s.endByDay !== undefined || (s.plan.routeId === "JAI-OKH" && s.role === "free"));
        const cands = wins
          .map((w, j) => j)
          .filter((j) => cap[j] >= need && (!early || wins[j][0] < SEP(12, 12)));
        if (cands.length === 0) {
          ok = false;
          break;
        }
        const j = cands[Math.floor(this.rng() * cands.length)];
        assign[j].push(i);
        cap[j] -= need;
      }
      if (!ok) continue;
      const placed: { i: number; starts: number[] }[] = [];
      for (let j = 0; j < wins.length && ok; j++) {
        const list = assign[j];
        if (list.length === 0) continue;
        const [a, z] = wins[j];
        let done = false;
        for (let r = 0; r < 40 && !done; r++) {
          const seq = shuffle(this.rng, [...list]);
          seq.sort((x, y) => Number(blocks[y].some((s) => s.kmBalancer)) - Number(blocks[x].some((s) => s.kmBalancer)));
          const dwells = seq.map((i) => blocks[i].map((s) => (endsAtYard(s.plan.routeId) ? 0 : Math.round(uni(this.rng, 180, 540)))));
          const busy = seq.reduce((acc, i, n) => acc + blocks[i].reduce((x, s, m) => x + s.plan.dur + dwells[n][m], 0), 0);
          const slack = z - a - busy - (seq.length + 1) * YARD_GAP_MIN;
          if (slack < 0) break;
          const cuts = seq.map(() => this.rng());
          const tot = cuts.reduce((x, y) => x + y, 0) + this.rng();
          let t = a + YARD_GAP_MIN;
          const trial: { i: number; starts: number[] }[] = [];
          let fine = true;
          seq.forEach((i, n) => {
            const gap = Math.floor((slack * cuts[n]) / tot);
            t += gap;
            const starts: number[] = [];
            blocks[i].forEach((s, m) => {
              starts.push(t);
              if (!slotOk(s, t)) fine = false;
              t += s.plan.dur + dwells[n][m];
            });
            t += YARD_GAP_MIN;
            trial.push({ i, starts });
          });
          if (fine && t <= z + YARD_GAP_MIN) {
            placed.push(...trial);
            done = true;
          }
        }
        if (!done) ok = false;
      }
      if (!ok) continue;
      for (const { i, starts } of placed) {
        blocks[i].forEach((s, m) => (s.start = starts[m]));
        const last = blocks[i][blocks[i].length - 1];
        this.blocks.push({
          name: "filler",
          plate,
          slots: blocks[i],
          start: starts[0],
          end: last.start + last.plan.dur,
          terminal: false,
          filler: true,
          specs: specs[i],
        });
      }
      return true;
    }
    return false;
  }

  slots(): Slot[] {
    return this.blocks.flatMap((b) => b.slots).sort((a, b) => a.start - b.start || a.plate.localeCompare(b.plate));
  }

  remove(block: Block): void {
    this.blocks = this.blocks.filter((b) => b !== block);
  }
}

export function shuffle<T>(rng: Rng, xs: T[]): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}
