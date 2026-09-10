"use client";

import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/use-api-resource";
import { useDriverName } from "@/hooks/use-driver-name";
import { pluralize } from "@/lib/format";
import { getStreak, type StreakResponse } from "@/lib/trip-api";

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDayKey(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function nextStep({ streak, minScore }: StreakResponse): string {
  if (streak.current === 0) {
    return `Score ${minScore} or more on a trip today to start a streak.`;
  }
  const doneToday = streak.lastQualifyingDay === todayKey();
  return doneToday
    ? `Today counts. Score ${minScore} or more tomorrow to keep it going.`
    : `Score ${minScore} or more on a trip today to keep it going.`;
}

export function StreakSummary() {
  const [storedName] = useDriverName();
  const driverName = storedName.trim() || null;
  const load = useCallback(() => getStreak(driverName), [driverName]);
  const { state } = useApiResource(load);

  if (state.status === "loading") {
    return <Skeleton className="h-28 w-full" aria-label="Loading streak" />;
  }

  if (state.status === "error") {
    return (
      <p className="rounded-lg border bg-card px-4 py-3 text-small text-muted-foreground">
        Streak isn&rsquo;t available right now:{" "}
        {state.error instanceof Error ? state.error.message : "unknown error"}
      </p>
    );
  }

  const { streak } = state.data;

  return (
    <section
      aria-labelledby="streak-heading"
      className="rounded-lg border bg-card px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h2
            id="streak-heading"
            className="text-label uppercase text-muted-foreground"
          >
            {driverName ? `${driverName}'s streak` : "Streak, all drivers"}
          </h2>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-heading font-semibold">{streak.current}</span>
            <span className="text-body text-foreground-secondary">
              {streak.current === 1 ? "day" : "days"} in a row
            </span>
          </p>
        </div>
        <dl className="flex gap-8 text-small">
          <div>
            <dt className="text-muted-foreground">Best</dt>
            <dd className="font-medium">{pluralize(streak.best, "day")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last qualifying day</dt>
            <dd className="font-medium">
              {streak.lastQualifyingDay
                ? formatDayKey(streak.lastQualifyingDay)
                : "None yet"}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 text-caption text-muted-foreground">
        {nextStep(state.data)}
        {!driverName &&
          " Add your name on the Record page to track your own streak."}
      </p>
    </section>
  );
}
