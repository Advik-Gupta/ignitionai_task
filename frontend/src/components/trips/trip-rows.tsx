import Link from "next/link";
import {
  formatClockTime,
  formatDistance,
  formatDuration,
  formatShortDate,
} from "@/lib/format";
import type { Trip } from "@/lib/trip-api";
import { cn } from "@/lib/utils";
import { TripScore } from "./trip-score";

export function durationLabel(trip: Trip): string {
  if (trip.status === "active") return "In progress";
  return trip.durationSeconds === null
    ? "-"
    : formatDuration(trip.durationSeconds);
}

export function distanceLabel(trip: Trip): string {
  return trip.distanceMeters === null
    ? "-"
    : formatDistance(trip.distanceMeters);
}

export function TripRows({
  trips,
  className,
}: {
  trips: Trip[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y rounded-lg border bg-card", className)}>
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
