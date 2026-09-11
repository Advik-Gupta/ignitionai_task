"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedSampleDataButton } from "@/components/trips/seed-sample-data-button";
import { StreakSummary } from "@/components/trips/streak-summary";
import { TripRows } from "@/components/trips/trip-rows";
import { useApiResource } from "@/hooks/use-api-resource";
import { listTrips } from "@/lib/trip-api";

const RECENT_TRIP_COUNT = 4;

const STEPS = [
  {
    title: "Mount your phone",
    body: "Open this site on your phone and put it in a holder so it can't slide around. Allow location and motion access when your browser asks.",
  },
  {
    title: "Drive as you normally would",
    body: "Keep the screen on. Position and motion are read every second and uploaded while you drive, so a dropped connection doesn't lose the trip.",
  },
  {
    title: "End the trip",
    body: "You get a score out of 100, what cost you points, a tip for next time, and the route on a map.",
  },
];

export function RecentActivity() {
  const { state, reload } = useApiResource(listTrips);

  if (state.status === "loading") {
    return (
      <div aria-busy="true" aria-label="Loading recent trips">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Couldn&rsquo;t load your trips</AlertTitle>
        <AlertDescription>
          <p>
            {state.error instanceof Error
              ? state.error.message
              : "The server didn't respond."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.data.length === 0) {
    return (
      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-section font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t pt-4">
              <p className="font-mono text-small text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-title font-semibold">{step.title}</h3>
              <p className="mt-1 text-small text-foreground-secondary">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-foreground-secondary">
            No trips yet. Load a week of simulated drives to see scores,
            streaks and the leaderboard straight away.
          </p>
          <SeedSampleDataButton
            onSeeded={reload}
            confirmFirst={false}
            label="Load sample trips"
            buttonClassName="h-11 w-full sm:h-9 sm:w-auto sm:px-5"
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="recent-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recent-heading" className="text-section font-semibold">
          Recent trips
        </h2>
        <Link
          href="/trips"
          className="rounded-sm text-small text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
        >
          All trips
        </Link>
      </div>
      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <TripRows trips={state.data.slice(0, RECENT_TRIP_COUNT)} />
        <StreakSummary />
      </div>
    </section>
  );
}
