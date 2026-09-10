import type { EventTypeTotals, TripEventType } from "@/lib/trip-api";

export type DrivingTip = {
  title: string;
  body: string;
};

export const DRIVING_TIPS: Record<TripEventType, DrivingTip> = {
  harsh_braking: {
    title: "Brake earlier and more gently",
    body: "Hard stops cost you the most on this drive. Look further up the road, lift off the accelerator as soon as you see brake lights or a changing signal, and keep about three seconds between you and the car ahead so there's room to slow down gradually.",
  },
  over_speeding: {
    title: "Settle a little under the limit",
    body: "Speeding was your biggest cost. Pick a steady speed just below the limit and check the speedometer after overtaking or joining a faster road, since that's when speed tends to creep up without you noticing.",
  },
  sharp_turn: {
    title: "Slow down before the turn, not in it",
    body: "Sharp cornering cost you the most. Do your braking while the wheels are still straight, go into the turn at a speed you could hold steady all the way round, and only accelerate once you can see the exit.",
  },
  idle: {
    title: "Switch off during long waits",
    body: "Idling was the main cost on this drive. If you expect to be stopped for more than a minute, at a level crossing, a pickup or a long queue, turn the engine off. It saves fuel and nothing is lost by it.",
  },
};

export const CLEAN_TRIP_TIP: DrivingTip = {
  title: "Nothing to fix on this one",
  body: "No harsh braking, sharp turns, speeding or long idling were picked up. Drive like this again tomorrow to keep your streak going.",
};

export function topOffender(penalties: EventTypeTotals): TripEventType | null {
  let worst: TripEventType | null = null;
  for (const [type, penalty] of Object.entries(penalties) as Array<
    [TripEventType, number]
  >) {
    if (penalty > 0 && (worst === null || penalty > penalties[worst])) {
      worst = type;
    }
  }
  return worst;
}
