"use client";

import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
  LiveStats,
  MotionStatus,
  RecorderPhase,
} from "@/hooks/use-trip-recorder";
import { formatClockTime, formatElapsed, pluralize, toKmh } from "@/lib/format";
import type { Trip } from "@/lib/trip-api";
import { StatusList, StatusRow, type StatusTone } from "./status-list";

const LOW_ACCURACY_METRES = 30;

type LivePanelProps = {
  phase: Extract<RecorderPhase, { name: "recording" | "ending" }>;
  stats: LiveStats;
  onEnd: (trip: Trip) => void;
};

type Status = { value: string; tone: StatusTone; detail?: string };

const MOTION_STATUS: Record<MotionStatus, Status> = {
  waiting: { value: "Waiting for readings", tone: "neutral" },
  active: { value: "Active", tone: "good" },
  unavailable: {
    value: "Not detected",
    tone: "caution",
    detail: "Sharp turns won't be detected",
  },
  denied: {
    value: "Permission denied",
    tone: "caution",
    detail: "Sharp turns won't be detected",
  },
};

function gpsStatus(stats: LiveStats): Status {
  if (stats.gpsError) return { value: "Permission revoked", tone: "poor" };
  if (stats.gpsLost || !stats.fix) {
    return {
      value: "Signal lost",
      tone: "caution",
      detail: "Readings pause until a fix returns",
    };
  }
  const accuracy = Math.round(stats.fix.accuracy);
  return accuracy <= LOW_ACCURACY_METRES
    ? { value: `±${accuracy} m`, tone: "good" }
    : { value: `±${accuracy} m`, tone: "caution", detail: "Low accuracy" };
}

export function LivePanel({ phase, stats, onEnd }: LivePanelProps) {
  const recording = phase.name === "recording";
  const endError = phase.name === "ending" ? phase.error : null;

  const speed =
    !stats.gpsLost && stats.fix?.speed != null
      ? Math.round(toKmh(stats.fix.speed))
      : null;
  const speedNote = stats.gpsLost
    ? "No GPS signal"
    : stats.fix && stats.fix.speed === null
      ? "Not reported by this device yet"
      : undefined;

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-6 px-5 pt-6 pb-32 sm:px-8 sm:pt-10 sm:pb-12">
      <div className="flex items-center justify-between gap-4">
        <p
          className="flex items-center gap-2 text-label uppercase"
          aria-live="polite"
        >
          {recording ? (
            <>
              <span
                className="size-2 animate-pulse rounded-full bg-poor"
                aria-hidden
              />
              <span>Recording</span>
            </>
          ) : (
            <span className="text-muted-foreground">Stopped</span>
          )}
        </p>
        <p className="text-caption text-muted-foreground">
          Started {formatClockTime(phase.trip.startTime)}
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x rounded-lg border bg-card">
        <Readout
          label="Speed"
          value={speed === null ? "--" : String(speed)}
          unit="km/h"
          note={speedNote}
        />
        <Readout label="Elapsed" value={formatElapsed(stats.elapsedSeconds)} />
      </div>

      {endError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Trip not saved yet</AlertTitle>
          <AlertDescription>{endError}</AlertDescription>
        </Alert>
      )}

      {stats.gpsError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Location access was turned off</AlertTitle>
          <AlertDescription>{stats.gpsError}</AlertDescription>
        </Alert>
      )}

      {recording && stats.uploadError && (
        <Alert>
          <TriangleAlert className="text-caution" />
          <AlertTitle>Uploads are failing</AlertTitle>
          <AlertDescription>
            Readings are kept on this phone and retried every few seconds. Last
            error: {stats.uploadError}
          </AlertDescription>
        </Alert>
      )}

      {(stats.motion === "unavailable" || stats.motion === "denied") && (
        <Alert>
          <TriangleAlert className="text-caution" />
          <AlertTitle>
            {stats.motion === "denied"
              ? "Motion sensor permission denied"
              : "No motion readings from this device"}
          </AlertTitle>
          <AlertDescription>
            Recording carries on with GPS only. Speed, braking and idle time are
            still tracked, but sharp turns aren&rsquo;t. On a laptop or desktop
            this is expected.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="sensors-heading">
        <h2
          id="sensors-heading"
          className="mb-3 text-label uppercase text-muted-foreground"
        >
          Sensors and upload
        </h2>
        <StatusList>
          <StatusRow label="GPS" {...gpsStatus(stats)} />
          <StatusRow label="Motion sensor" {...MOTION_STATUS[stats.motion]} />
          <StatusRow
            label="Uploaded"
            value={pluralize(stats.uploadedCount, "reading")}
            tone={stats.uploadError ? "caution" : "neutral"}
            detail={
              stats.pendingCount > 0
                ? `${stats.pendingCount} waiting to upload`
                : "Up to date"
            }
          />
          <StatusRow
            label="Screen"
            value={stats.screenLock === "held" ? "Kept awake" : "May lock"}
            tone={stats.screenLock === "held" ? "neutral" : "caution"}
            detail={
              stats.screenLock === "held"
                ? undefined
                : "Keep the screen on or recording pauses"
            }
          />
        </StatusList>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto max-w-reading">
          {recording ? (
            <EndTripButton onConfirm={() => onEnd(phase.trip)} />
          ) : (
            <Button
              className="h-11 w-full sm:w-auto sm:px-6"
              disabled={!endError}
              onClick={() => onEnd(phase.trip)}
            >
              {endError ? "Try again" : "Saving trip…"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 px-3 py-4 min-[400px]:px-4 min-[400px]:py-5">
      <p className="text-label uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-section tabular-nums min-[400px]:text-heading sm:text-display">
        {value}
        {unit && (
          <span className="ml-1.5 font-sans text-small text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      {note && (
        <p className="mt-1 text-caption text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

function EndTripButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="h-11 w-full sm:w-auto sm:px-6">End trip</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this trip?</AlertDialogTitle>
          <AlertDialogDescription>
            Recording stops and anything still waiting is uploaded. You
            can&rsquo;t add to this trip afterwards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep recording</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>End trip</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
