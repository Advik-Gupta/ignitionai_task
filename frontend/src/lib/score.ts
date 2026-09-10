export type ScoreBand = "good" | "fair" | "poor";

export const SCORE_BAND_MIN = {
  good: 80,
  fair: 50,
} as const;

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  good: "Safe",
  fair: "Needs work",
  poor: "Risky",
};

export const SCORE_BAND_TEXT_CLASS: Record<ScoreBand, string> = {
  good: "text-good",
  fair: "text-caution",
  poor: "text-poor",
};

export const SCORE_BAND_BORDER_CLASS: Record<ScoreBand, string> = {
  good: "border-good/40",
  fair: "border-caution/40",
  poor: "border-poor/40",
};

export function scoreBand(score: number): ScoreBand {
  if (score >= SCORE_BAND_MIN.good) return "good";
  if (score >= SCORE_BAND_MIN.fair) return "fair";
  return "poor";
}
