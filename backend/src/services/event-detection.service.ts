import { DETECTION } from "../config/detection";
import type { TripEventType } from "../models/trip-event.model";

export type DetectionPoint = {
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
};

export type DetectedEvent = {
  type: TripEventType;
  timestamp: Date;
  lat: number;
  lng: number;
  severity: number;
  rawValue: number;
};

export type EventSummary = Record<TripEventType, number>;

type Sample = { point: DetectionPoint; value: number };

const MPS_TO_KMH = 3.6;

function secondsBetween(from: DetectionPoint, to: DetectionPoint): number {
  return (to.timestamp.getTime() - from.timestamp.getTime()) / 1000;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function severityBetween(value: number, threshold: number, severe: number) {
  return Math.min(1, Math.max(0, (value - threshold) / (severe - threshold)));
}

function toEvent(
  type: TripEventType,
  point: DetectionPoint,
  rawValue: number,
  severity: number,
): DetectedEvent {
  return {
    type,
    timestamp: point.timestamp,
    lat: point.lat,
    lng: point.lng,
    severity: round(severity, 3),
    rawValue: round(rawValue, 2),
  };
}

function findEpisodes(
  points: DetectionPoint[],
  measure: (index: number) => number | null,
): Sample[][] {
  const episodes: Sample[][] = [];
  let current: Sample[] = [];

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    const value = measure(index);
    const last = current[current.length - 1];

    const brokenByGap =
      last !== undefined &&
      secondsBetween(last.point, point) > DETECTION.maxSampleGapSeconds;

    if (last && (value === null || brokenByGap)) {
      episodes.push(current);
      current = [];
    }
    if (value !== null) {
      current.push({ point, value });
    }
  }

  if (current.length > 0) episodes.push(current);
  return episodes;
}

function peakOf(episode: Sample[]): Sample {
  return episode.reduce((peak, sample) =>
    sample.value > peak.value ? sample : peak,
  );
}

function episodeDuration(episode: Sample[]): number {
  return secondsBetween(episode[0].point, episode[episode.length - 1].point);
}

function longitudinalAccel(
  points: DetectionPoint[],
  index: number,
): number | null {
  if (index === 0) return null;
  const previous = points[index - 1];
  const current = points[index];
  if (previous.speed === null || current.speed === null) return null;

  const seconds = secondsBetween(previous, current);
  if (seconds <= 0 || seconds > DETECTION.maxSampleGapSeconds) return null;

  return (current.speed - previous.speed) / seconds;
}

export function detectHarshBraking(points: DetectionPoint[]): DetectedEvent[] {
  const { minDecelerationMps2, severeDecelerationMps2, minSpeedMps } =
    DETECTION.harshBraking;

  const episodes = findEpisodes(points, (index) => {
    const accel = longitudinalAccel(points, index);
    if (accel === null) return null;

    const speedBefore = points[index - 1].speed ?? 0;
    const deceleration = -accel;
    return speedBefore >= minSpeedMps && deceleration >= minDecelerationMps2
      ? deceleration
      : null;
  });

  return episodes.map((episode) => {
    const peak = peakOf(episode);
    return toEvent(
      "harsh_braking",
      peak.point,
      peak.value,
      severityBetween(peak.value, minDecelerationMps2, severeDecelerationMps2),
    );
  });
}

export function detectSharpTurns(points: DetectionPoint[]): DetectedEvent[] {
  const { minLateralAccelMps2, severeLateralAccelMps2, minSpeedMps } =
    DETECTION.sharpTurn;

  const episodes = findEpisodes(points, (index) => {
    const { accelX, accelY, speed } = points[index];
    if (accelX === null || accelY === null) return null;
    if (speed === null || speed < minSpeedMps) return null;

    const horizontalSquared = accelX ** 2 + accelY ** 2;
    const longitudinal = longitudinalAccel(points, index) ?? 0;
    const lateral = Math.sqrt(
      Math.max(0, horizontalSquared - longitudinal ** 2),
    );

    return lateral >= minLateralAccelMps2 ? lateral : null;
  });

  return episodes.map((episode) => {
    const peak = peakOf(episode);
    return toEvent(
      "sharp_turn",
      peak.point,
      peak.value,
      severityBetween(peak.value, minLateralAccelMps2, severeLateralAccelMps2),
    );
  });
}

export function detectOverSpeeding(points: DetectionPoint[]): DetectedEvent[] {
  const { limitKmh, severeSpeedKmh, minDurationSeconds } =
    DETECTION.overSpeeding;

  const episodes = findEpisodes(points, (index) => {
    const { speed } = points[index];
    if (speed === null) return null;
    const kmh = speed * MPS_TO_KMH;
    return kmh > limitKmh ? kmh : null;
  });

  return episodes
    .filter((episode) => episodeDuration(episode) >= minDurationSeconds)
    .map((episode) => {
      const peak = peakOf(episode);
      return toEvent(
        "over_speeding",
        peak.point,
        peak.value,
        severityBetween(peak.value, limitKmh, severeSpeedKmh),
      );
    });
}

export function detectIdle(points: DetectionPoint[]): DetectedEvent[] {
  const { maxSpeedMps, minDurationSeconds, severeDurationSeconds } =
    DETECTION.idle;

  const episodes = findEpisodes(points, (index) => {
    const { speed } = points[index];
    return speed !== null && speed <= maxSpeedMps ? speed : null;
  });

  return episodes
    .map((episode) => ({ episode, duration: episodeDuration(episode) }))
    .filter(({ duration }) => duration >= minDurationSeconds)
    .map(({ episode, duration }) =>
      toEvent(
        "idle",
        episode[0].point,
        duration,
        severityBetween(duration, minDurationSeconds, severeDurationSeconds),
      ),
    );
}

export function detectEvents(points: DetectionPoint[]): DetectedEvent[] {
  return [
    ...detectHarshBraking(points),
    ...detectSharpTurns(points),
    ...detectOverSpeeding(points),
    ...detectIdle(points),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function summarizeEvents(events: DetectedEvent[]): EventSummary {
  const summary: EventSummary = {
    harsh_braking: 0,
    sharp_turn: 0,
    over_speeding: 0,
    idle: 0,
  };
  for (const event of events) {
    summary[event.type] += 1;
  }
  return summary;
}
