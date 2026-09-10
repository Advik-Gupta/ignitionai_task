import type { TripEventType } from "../models/trip-event.model";

export const STARTING_SCORE = 100;
export const MIN_SCORE = 0;

export type EventPenalty = {
  base: number;
  atFullSeverity: number;
};

export const EVENT_PENALTIES: Record<TripEventType, EventPenalty> = {
  harsh_braking: { base: 5, atFullSeverity: 10 },
  over_speeding: { base: 4, atFullSeverity: 10 },
  sharp_turn: { base: 4, atFullSeverity: 8 },
  idle: { base: 1, atFullSeverity: 3 },
};
