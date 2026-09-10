"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusList, StatusRow } from "@/components/record/status-list";
import { useApiResource } from "@/hooks/use-api-resource";
import { ApiError } from "@/lib/api";
import { EVENT_LABELS, EVENT_TYPES } from "@/lib/events";
import {
  formatClockTime,
  formatDistance,
  formatDuration,
  formatLongDate,
  pluralize,
} from "@/lib/format";
import { scoreBand } from "@/lib/score";
import { getTrip, type Trip, type TripDetail } from "@/lib/trip-api";
import { PenaltyChart } from "./penalty-chart";
import { ScoreBadge } from "./trip-score";

function formatPointsLost(value: number): string {
  return value > 0 ? `−${value}` : "0";
}

function averageSpeedLabel(trip: Trip): string {
  if (!trip.distanceMeters || !trip.durationSeconds) return "-";
  const kmh = (trip.distanceMeters / trip.durationSeconds) * 3.6;
  return `${Math.round(kmh)} km/h`;
}

export function TripDetailView({ tripId }: { tripId: string }) {
  const load = useCallback(() => getTrip(tripId), [tripId]);
  const { state, reload } = useApiResource(load);

  const notFound =
    state.status === "error" &&
    state.error instanceof ApiError &&
    (state.error.status === 404 || state.error.status === 400);

  return (
    <div className="mx-auto max-w-page px-5 py-6 sm:px-8 sm:py-10">
      <Link
        href="/trips"
        className="-ml-1 inline-flex items-center gap-1 rounded-sm text-small text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        All trips
      </Link>

      <div className="mt-4">
        {state.status === "loading" && <TripDetailSkeleton />}

        {notFound && <TripNotFound />}

        {state.status === "error" && !notFound && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Couldn&rsquo;t load this trip</AlertTitle>
            <AlertDescription>
              <p>
                {state.error instanceof Error
                  ? state.error.message
                  : "The server didn't respond."}{" "}
                Check that the API is running, then try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={reload}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {state.status === "ready" && <TripReport detail={state.data} />}
      </div>
    </div>
  );
}

function TripReport({ detail }: { detail: TripDetail }) {
  const { trip } = detail;
  const timeRange = trip.endTime
    ? `${formatClockTime(trip.startTime)} – ${formatClockTime(trip.endTime)}`
    : `Started ${formatClockTime(trip.startTime)}`;

  return (
    <>
      <header>
        <p className="text-label uppercase text-muted-foreground">
          {timeRange}
        </p>
        <h1 className="mt-2 text-heading font-semibold">
          {formatLongDate(trip.startTime)}
        </h1>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
        <section aria-labelledby="summary-heading" className="flex flex-col gap-6">
          <h2 id="summary-heading" className="sr-only">
            Summary
          </h2>
          <ScoreSummary detail={detail} />
          <StatusList>
            <StatusRow
              label="Duration"
              value={
                trip.durationSeconds === null
                  ? "In progress"
                  : formatDuration(trip.durationSeconds)
              }
            />
            <StatusRow
              label="Distance"
              value={
                trip.distanceMeters === null
                  ? "-"
                  : formatDistance(trip.distanceMeters)
              }
            />
            <StatusRow label="Average speed" value={averageSpeedLabel(trip)} />
            <StatusRow
              label="Readings"
              value={pluralize(trip.rawPointCount, "reading")}
            />
          </StatusList>
        </section>

        {trip.score !== null && <Breakdown detail={detail} />}
      </div>
    </>
  );
}

function ScoreSummary({ detail }: { detail: TripDetail }) {
  const { trip, events, totalPenalty } = detail;

  if (trip.status === "active") {
    return (
      <Alert>
        <TriangleAlert className="text-caution" />
        <AlertTitle>Still recording</AlertTitle>
        <AlertDescription>
          This trip hasn&rsquo;t been ended, so it has no score yet. Open{" "}
          <Link href="/record">Record</Link> on the phone that started it to
          resume or end it.
        </AlertDescription>
      </Alert>
    );
  }

  if (trip.score === null) {
    return (
      <div>
        <p className="text-label uppercase text-muted-foreground">
          Safety score
        </p>
        <p className="mt-2 text-section font-semibold">Not scored</p>
        <p className="mt-1 text-small text-foreground-secondary">
          No GPS readings came through during this trip, so there was nothing
          to judge.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-label uppercase text-muted-foreground">Safety score</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-display font-semibold">{trip.score}</span>
        <span className="text-body text-muted-foreground">/ 100</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <ScoreBadge band={scoreBand(trip.score)} />
        <span className="text-small text-foreground-secondary">
          {totalPenalty > 0
            ? `${totalPenalty} points lost across ${pluralize(events.length, "event")}`
            : "No points lost"}
        </span>
      </div>
    </div>
  );
}

function Breakdown({ detail }: { detail: TripDetail }) {
  const { summary, penalties, totalPenalty, events } = detail;

  return (
    <section aria-labelledby="breakdown-heading" className="min-w-0">
      <h2 id="breakdown-heading" className="text-section font-semibold">
        Where the points went
      </h2>
      <p className="mt-1 text-small text-muted-foreground">
        Each event costs points. Braking and speeding cost the most, and a
        worse event costs more than a mild one.
      </p>

      {events.length === 0 ? (
        <p className="mt-6 rounded-lg border bg-card px-4 py-6 text-body text-foreground-secondary">
          No harsh braking, sharp turns, speeding or long idling were detected
          on this trip.
        </p>
      ) : (
        <div className="mt-6 rounded-lg border bg-card px-2 py-4 sm:px-4">
          <PenaltyChart penalties={penalties} counts={summary} />
        </div>
      )}

      <div className="mt-6 rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Event</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="px-4 text-right">Points lost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVENT_TYPES.map((type) => (
              <TableRow key={type} className="hover:bg-transparent">
                <TableCell className="px-4">{EVENT_LABELS[type]}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {summary[type]}
                </TableCell>
                <TableCell className="px-4 text-right tabular-nums">
                  {formatPointsLost(penalties[type])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="px-4 font-medium">Total</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {events.length}
              </TableCell>
              <TableCell className="px-4 text-right font-medium tabular-nums">
                {formatPointsLost(totalPenalty)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}

function TripNotFound() {
  return (
    <section className="rounded-lg border bg-card px-5 py-10 text-center sm:px-8">
      <h1 className="text-section font-semibold">Trip not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-body text-foreground-secondary">
        There&rsquo;s no trip at this address. The link may be incomplete, or
        the trip was removed.
      </p>
      <Button asChild variant="outline" className="mt-6 h-11 sm:h-9">
        <Link href="/trips">Back to trips</Link>
      </Button>
    </section>
  );
}

function TripDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading trip">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-8 w-72 max-w-full" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-24 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
