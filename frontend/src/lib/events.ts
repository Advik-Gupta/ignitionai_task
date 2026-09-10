import type { TripEventType } from "@/lib/trip-api";

export const EVENT_TYPES: TripEventType[] = [
  "harsh_braking",
  "over_speeding",
  "sharp_turn",
  "idle",
];

export const EVENT_LABELS: Record<TripEventType, string> = {
  harsh_braking: "Harsh braking",
  over_speeding: "Over-speeding",
  sharp_turn: "Sharp turns",
  idle: "Idling",
};
