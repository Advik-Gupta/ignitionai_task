import { formatDuration } from "@/lib/format";
import type { TripEvent, TripEventType } from "@/lib/trip-api";

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

export const EVENT_MARKER_LETTERS: Record<TripEventType, string> = {
  harsh_braking: "B",
  over_speeding: "S",
  sharp_turn: "T",
  idle: "I",
};

const SEVERITY_BANDS = [
  { below: 0.34, label: "Mild" },
  { below: 0.67, label: "Moderate" },
];

export function severityLabel(severity: number): string {
  return (
    SEVERITY_BANDS.find((band) => severity < band.below)?.label ?? "Severe"
  );
}

export function describeEventMeasurement(event: TripEvent): string {
  switch (event.type) {
    case "harsh_braking":
      return `Slowed at ${event.rawValue.toFixed(1)} m/s²`;
    case "sharp_turn":
      return `${event.rawValue.toFixed(1)} m/s² sideways`;
    case "over_speeding":
      return `Peaked at ${Math.round(event.rawValue)} km/h`;
    case "idle":
      return `Stopped for ${formatDuration(event.rawValue)}`;
  }
}
