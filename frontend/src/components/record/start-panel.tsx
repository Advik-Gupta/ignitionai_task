"use client";

import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DRIVER_NAME_MAX_LENGTH,
  useDriverName,
} from "@/hooks/use-driver-name";
import { useGeolocationPermission } from "@/hooks/use-geolocation-permission";
import type {
  RecorderPhase,
  StartOptions,
} from "@/hooks/use-trip-recorder";
import { formatDateTime, pluralize } from "@/lib/format";
import type { SensorSupport } from "@/lib/sensors";
import type { Trip } from "@/lib/trip-api";
import { StatusList, StatusRow } from "./status-list";

type StartPanelProps = {
  phase: Extract<
    RecorderPhase,
    { name: "idle" | "interrupted" | "starting" | "ending" }
  >;
  support: SensorSupport;
  onStart: (options?: StartOptions) => void;
  onEnd: (trip: Trip) => void;
};

export function StartPanel({ phase, support, onStart, onEnd }: StartPanelProps) {
  const [driverName, setDriverName] = useDriverName();
  const locationPermission = useGeolocationPermission();
  const locationBlocked = locationPermission === "denied";
  const blocked =
    !support.secureContext || !support.geolocation || locationBlocked;
  const starting = phase.name === "starting";
  const unfinished =
    phase.name === "interrupted" || phase.name === "ending" ? phase : null;

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
      <div>
        <h1 className="text-heading font-semibold">Record a trip</h1>
        <p className="mt-2 text-body text-foreground-secondary">
          Mount your phone before you set off and leave this page open with the
          screen on. Position and motion are read once a second and uploaded
          every few seconds, so closing the tab only loses the last few seconds
          of the drive.
        </p>
      </div>

      {!support.secureContext && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>This page isn&rsquo;t on HTTPS</AlertTitle>
          <AlertDescription>
            Browsers only share location and motion sensors with pages served
            over HTTPS or from localhost. Open the app from its https:// address
            to record a trip.
          </AlertDescription>
        </Alert>
      )}

      {support.secureContext && !support.geolocation && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>This browser can&rsquo;t read your location</AlertTitle>
          <AlertDescription>
            A trip is built from GPS positions, so recording isn&rsquo;t
            possible here. Try a current version of Chrome or Safari on your
            phone.
          </AlertDescription>
        </Alert>
      )}

      {support.secureContext && support.geolocation && locationBlocked && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Location is blocked for this site</AlertTitle>
          <AlertDescription>
            <p>
              A trip is built from GPS, so recording can&rsquo;t start until
              location is allowed again.
            </p>
            <ul className="list-disc pl-4">
              <li>
                Chrome: tap the icon to the left of the address, open
                Permissions, and turn on Location.
              </li>
              <li>
                Safari on iPhone: open Settings, Privacy &amp; Security,
                Location Services, Safari Websites, and choose While Using the
                App.
              </li>
            </ul>
            <p>
              Then come back to this page. Start unlocks as soon as the browser
              reports the change.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {phase.name === "idle" && phase.error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Recording didn&rsquo;t start</AlertTitle>
          <AlertDescription>{phase.error}</AlertDescription>
        </Alert>
      )}

      {unfinished && (
        <UnfinishedTrip
          trip={unfinished.trip}
          ending={unfinished.name === "ending" && !unfinished.error}
          error={unfinished.error}
          canResume={!blocked}
          onResume={() => onStart({ existing: unfinished.trip })}
          onEnd={() => onEnd(unfinished.trip)}
        />
      )}

      {!unfinished && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="driver-name">Driver name</Label>
          <Input
            id="driver-name"
            value={driverName}
            onChange={(event) => setDriverName(event.target.value)}
            maxLength={DRIVER_NAME_MAX_LENGTH}
            placeholder="e.g. Meera"
            autoComplete="given-name"
            disabled={starting}
            className="h-11 sm:h-9"
          />
          <p className="text-caption text-muted-foreground">
            {driverName.trim()
              ? "Trips are saved under this name for your streak and the leaderboard."
              : "Optional. Trips without a name are still scored, but don't count towards a streak or the leaderboard."}
          </p>
        </div>
      )}

      <section aria-labelledby="device-heading">
        <h2
          id="device-heading"
          className="mb-3 text-label uppercase text-muted-foreground"
        >
          This device
        </h2>
        <StatusList>
          <StatusRow
            label="Location"
            value={
              !support.geolocation
                ? "Not available"
                : locationBlocked
                  ? "Blocked"
                  : "Available"
            }
            tone={support.geolocation && !locationBlocked ? "good" : "poor"}
            detail={
              !support.geolocation
                ? undefined
                : locationBlocked
                  ? "Allow it in your browser settings"
                  : locationPermission === "granted"
                    ? "Already allowed"
                    : "Asks for permission when you start"
            }
          />
          <StatusRow
            label="Motion sensor"
            value={support.motion ? "Available" : "Not available"}
            tone={support.motion ? "good" : "caution"}
            detail={
              !support.motion
                ? "Sharp turns won't be detected"
                : support.motionNeedsPermission
                  ? "Asks for permission when you start"
                  : "Confirmed once readings arrive"
            }
          />
          <StatusRow
            label="Keep screen on"
            value={support.wakeLock ? "Supported" : "Not supported"}
            tone={support.wakeLock ? "good" : "caution"}
            detail={
              support.wakeLock ? undefined : "Stop the screen locking yourself"
            }
          />
          <StatusRow
            label="Secure connection"
            value={support.secureContext ? "Yes" : "No"}
            tone={support.secureContext ? "good" : "poor"}
          />
        </StatusList>
      </section>

      {!unfinished && (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-11 w-full text-title"
            disabled={blocked || starting}
            onClick={() => onStart({ driverName: driverName.trim() || null })}
          >
            {starting ? "Waiting for GPS…" : "Start trip"}
          </Button>
          {starting && (
            <p className="text-caption text-muted-foreground" aria-live="polite">
              Allow location access if your browser asks. The first fix can take
              up to 30 seconds.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type UnfinishedTripProps = {
  trip: Trip;
  ending: boolean;
  error: string | null;
  canResume: boolean;
  onResume: () => void;
  onEnd: () => void;
};

function UnfinishedTrip({
  trip,
  ending,
  error,
  canResume,
  onResume,
  onEnd,
}: UnfinishedTripProps) {
  return (
    <section
      className="rounded-lg border bg-card p-4"
      aria-labelledby="unfinished-heading"
    >
      <h2 id="unfinished-heading" className="text-title font-semibold">
        A trip is still open
      </h2>
      <p className="mt-1 text-small text-foreground-secondary">
        Started {formatDateTime(trip.startTime)} with{" "}
        {pluralize(trip.rawPointCount, "reading")} saved. The page was closed
        before it was ended. Resume to keep adding to it, or end it now.
      </p>

      {error && (
        <p className="mt-3 text-small text-poor" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 sm:h-9"
          disabled={!canResume || ending}
          onClick={onResume}
        >
          Resume recording
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-9"
          disabled={ending}
          onClick={onEnd}
        >
          {ending ? "Ending trip…" : "End trip"}
        </Button>
      </div>
    </section>
  );
}
