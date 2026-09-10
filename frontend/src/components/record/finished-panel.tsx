"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  formatDistance,
  formatElapsed,
  pluralize,
} from "@/lib/format";
import { SCORE_BAND_LABELS, scoreBand } from "@/lib/score";
import type { Trip } from "@/lib/trip-api";
import { StatusList, StatusRow, type StatusTone } from "./status-list";

type FinishedPanelProps = {
  trip: Trip;
  onRecordAnother: () => void;
};

const BAND_TONE: Record<ReturnType<typeof scoreBand>, StatusTone> = {
  good: "good",
  fair: "caution",
  poor: "poor",
};

export function FinishedPanel({ trip, onRecordAnother }: FinishedPanelProps) {
  const band = trip.score === null ? null : scoreBand(trip.score);

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
      <div>
        <p className="text-label uppercase text-good">Trip saved</p>
        <h1 className="mt-2 text-heading font-semibold">
          {formatElapsed(trip.durationSeconds ?? 0)} on the road
        </h1>
      </div>

      {trip.rawPointCount === 0 && (
        <Alert>
          <TriangleAlert className="text-caution" />
          <AlertTitle>No readings were recorded</AlertTitle>
          <AlertDescription>
            The trip was saved, but no GPS fix came through while it was
            running, so there&rsquo;s nothing to score. This usually means the
            signal was lost for the whole trip.
          </AlertDescription>
        </Alert>
      )}

      <StatusList>
        {trip.score !== null && band && (
          <StatusRow
            label="Score"
            value={`${trip.score} · ${SCORE_BAND_LABELS[band]}`}
            tone={BAND_TONE[band]}
          />
        )}
        <StatusRow
          label="Distance"
          value={
            trip.distanceMeters === null
              ? "-"
              : formatDistance(trip.distanceMeters)
          }
        />
        <StatusRow label="Started" value={formatDateTime(trip.startTime)} />
        <StatusRow
          label="Ended"
          value={trip.endTime ? formatDateTime(trip.endTime) : "-"}
        />
        <StatusRow
          label="Readings"
          value={pluralize(trip.rawPointCount, "reading")}
        />
      </StatusList>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="h-11 sm:h-9 sm:px-5">
          <Link href={`/trips/${trip.id}`}>View trip</Link>
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-9 sm:px-5"
          onClick={onRecordAnother}
        >
          Record another trip
        </Button>
      </div>
    </div>
  );
}
