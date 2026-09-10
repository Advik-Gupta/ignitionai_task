import { EVENT_PENALTIES, MIN_SCORE, STARTING_SCORE } from "../config/scoring";
import type { TripEventType } from "../models/trip-event.model";

export type ScorableEvent = {
  type: TripEventType;
  severity: number;
};

export type PenaltyBreakdown = Record<TripEventType, number>;

export type TripScore = {
  score: number;
  totalPenalty: number;
  penalties: PenaltyBreakdown;
};

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function eventPenalty(event: ScorableEvent): number {
  const { base, atFullSeverity } = EVENT_PENALTIES[event.type];
  const severity = Math.min(1, Math.max(0, event.severity));
  return base + (atFullSeverity - base) * severity;
}

export function scoreTrip(events: ScorableEvent[]): TripScore {
  const penalties: PenaltyBreakdown = {
    harsh_braking: 0,
    sharp_turn: 0,
    over_speeding: 0,
    idle: 0,
  };

  for (const event of events) {
    penalties[event.type] += eventPenalty(event);
  }

  const totalPenalty = Object.values(penalties).reduce(
    (sum, penalty) => sum + penalty,
    0,
  );

  return {
    score: Math.round(Math.max(MIN_SCORE, STARTING_SCORE - totalPenalty)),
    totalPenalty: roundTo(totalPenalty, 1),
    penalties: {
      harsh_braking: roundTo(penalties.harsh_braking, 1),
      sharp_turn: roundTo(penalties.sharp_turn, 1),
      over_speeding: roundTo(penalties.over_speeding, 1),
      idle: roundTo(penalties.idle, 1),
    },
  };
}
