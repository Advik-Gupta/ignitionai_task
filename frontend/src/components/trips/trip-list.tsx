"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  formatClockTime,
  formatDistance,
  formatDuration,
  formatShortDate,
  pluralize,
} from "@/lib/format";
import { listTrips, type Trip } from "@/lib/trip-api";
import { StreakSummary } from "./streak-summary";
import { TripScore } from "./trip-score";

function durationLabel(trip: Trip): string {
  if (trip.status === "active") return "In progress";
  return trip.durationSeconds === null
    ? "-"
    : formatDuration(trip.durationSeconds);
}

function distanceLabel(trip: Trip): string {
  return trip.distanceMeters === null
    ? "-"
    : formatDistance(trip.distanceMeters);
}

function overviewLine(trips: Trip[]): string {
  const scores = trips
    .map((trip) => trip.score)
    .filter((score): score is number => score !== null);
  const count = pluralize(trips.length, "trip");
  if (scores.length === 0) return count;
  const average = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  );
  return `${count} · average score ${average}`;
}

export function TripList() {
  const { state, reload } = useApiResource(listTrips);

  return (
    <div className="mx-auto max-w-page px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-heading font-semibold">Trips</h1>
          <p className="mt-1 text-small text-muted-foreground">
            {state.status === "ready" && state.data.length > 0
              ? overviewLine(state.data)
              : "Your recorded drives, newest first"}
          </p>
        </div>
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href="/record">Record a trip</Link>
        </Button>
      </div>

      <div className="mt-8">
        {state.status === "loading" && <TripListSkeleton />}

        {state.status === "error" && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Couldn&rsquo;t load your trips</AlertTitle>
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

        {state.status === "ready" && state.data.length === 0 && <EmptyTrips />}

        {state.status === "ready" && state.data.length > 0 && (
          <div className="flex flex-col gap-6">
            <StreakSummary />
            <TripTable trips={state.data} />
            <TripRows trips={state.data} />
          </div>
        )}
      </div>
    </div>
  );
}

function TripTable({ trips }: { trips: Trip[] }) {
  return (
    <div className="hidden rounded-lg border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Date</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead className="px-4 text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id} className="relative">
              <TableCell className="px-4 py-3">
                <Link
                  href={`/trips/${trip.id}`}
                  className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {formatShortDate(trip.startTime)}
                </Link>
                <span className="ml-2 text-muted-foreground">
                  {formatClockTime(trip.startTime)}
                </span>
                {trip.demo && (
                  <span className="ml-2 text-caption text-muted-foreground">
                    Sample
                  </span>
                )}
              </TableCell>
              <TableCell
                className={
                  trip.driverName
                    ? "text-foreground-secondary"
                    : "text-muted-foreground"
                }
              >
                {trip.driverName ?? "No name"}
              </TableCell>
              <TableCell className="tabular-nums text-foreground-secondary">
                {durationLabel(trip)}
              </TableCell>
              <TableCell className="tabular-nums text-foreground-secondary">
                {distanceLabel(trip)}
              </TableCell>
              <TableCell className="px-4 text-right">
                <TripScore trip={trip} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TripRows({ trips }: { trips: Trip[] }) {
  return (
    <ul className="divide-y rounded-lg border bg-card md:hidden">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-colors duration-150 ease-standard hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="text-body font-medium">
                {formatShortDate(trip.startTime)},{" "}
                {formatClockTime(trip.startTime)}
              </p>
              <p className="truncate text-caption text-muted-foreground">
                {[
                  trip.driverName,
                  durationLabel(trip),
                  distanceLabel(trip),
                  trip.demo ? "Sample" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <TripScore trip={trip} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EmptyTrips() {
  return (
    <section className="rounded-lg border bg-card px-5 py-10 text-center sm:px-8">
      <h2 className="text-section font-semibold">No trips yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-foreground-secondary">
        Record a drive from your phone. When you end it, it shows up here with
        its score. To look around first, run{" "}
        <code className="font-mono text-small text-foreground">npm run seed</code>{" "}
        to load sample trips.
      </p>
      <Button asChild className="mt-6 h-11 w-full sm:h-9 sm:w-auto sm:px-5">
        <Link href="/record">Record a trip</Link>
      </Button>
    </section>
  );
}

function TripListSkeleton() {
  return (
    <div
      className="divide-y rounded-lg border bg-card"
      aria-busy="true"
      aria-label="Loading trips"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-4 py-4"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
