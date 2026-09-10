"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSensorSupport } from "@/hooks/use-sensor-support";
import { useTripRecorder } from "@/hooks/use-trip-recorder";
import { FinishedPanel } from "./finished-panel";
import { LivePanel } from "./live-panel";
import { StartPanel } from "./start-panel";

export function TripRecorder() {
  const support = useSensorSupport();
  const { phase, stats, start, finish, reset } = useTripRecorder();

  if (!support || phase.name === "checking") {
    return <RecorderSkeleton />;
  }

  switch (phase.name) {
    case "idle":
    case "interrupted":
    case "starting":
      return (
        <StartPanel
          phase={phase}
          support={support}
          onStart={start}
          onEnd={finish}
        />
      );
    case "ending":
      return phase.from === "interrupted" ? (
        <StartPanel
          phase={phase}
          support={support}
          onStart={start}
          onEnd={finish}
        />
      ) : (
        <LivePanel phase={phase} stats={stats} onEnd={finish} />
      );
    case "recording":
      return <LivePanel phase={phase} stats={stats} onEnd={finish} />;
    case "finished":
      return <FinishedPanel trip={phase.trip} onRecordAnother={reset} />;
  }
}

function RecorderSkeleton() {
  return (
    <div
      className="mx-auto flex max-w-reading flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12"
      aria-busy="true"
      aria-label="Loading recorder"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
