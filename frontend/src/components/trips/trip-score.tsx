import { Badge } from "@/components/ui/badge";
import {
  SCORE_BAND_BORDER_CLASS,
  SCORE_BAND_LABELS,
  SCORE_BAND_TEXT_CLASS,
  scoreBand,
  type ScoreBand,
} from "@/lib/score";
import type { Trip } from "@/lib/trip-api";
import { cn } from "@/lib/utils";

export function ScoreBadge({ band }: { band: ScoreBand }) {
  return (
    <Badge
      variant="outline"
      className={cn(SCORE_BAND_TEXT_CLASS[band], SCORE_BAND_BORDER_CLASS[band])}
    >
      {SCORE_BAND_LABELS[band]}
    </Badge>
  );
}

export function TripScore({ trip }: { trip: Trip }) {
  if (trip.status === "active") {
    return <span className="text-small text-muted-foreground">Recording</span>;
  }
  if (trip.score === null) {
    return <span className="text-small text-muted-foreground">Not scored</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-title font-semibold tabular-nums">
        {trip.score}
      </span>
      <ScoreBadge band={scoreBand(trip.score)} />
    </span>
  );
}
