"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  EVENT_LABELS,
  EVENT_MARKER_LETTERS,
  EVENT_TYPES,
  describeEventMeasurement,
  severityLabel,
} from "@/lib/events";
import { formatClockTimeWithSeconds, pluralize } from "@/lib/format";
import {
  getTripRoute,
  type TripEvent,
  type TripEventType,
} from "@/lib/trip-api";
import { cn } from "@/lib/utils";
import type { FocusRequest } from "./route-map";

const MAP_HEIGHT_CLASS = "h-80 sm:h-[28rem]";

const RouteMap = dynamic(
  () => import("./route-map").then((module) => module.RouteMap),
  {
    ssr: false,
    loading: () => <Skeleton className={cn("w-full", MAP_HEIGHT_CLASS)} />,
  },
);

type RouteSectionProps = {
  tripId: string;
  events: TripEvent[];
};

export function EventGlyph({ type }: { type: TripEventType }) {
  return (
    <span
      data-type={type}
      aria-hidden
      className="trip-event-glyph flex size-6 shrink-0 items-center justify-center rounded-full text-label font-semibold"
    >
      {EVENT_MARKER_LETTERS[type]}
    </span>
  );
}

export function RouteSection({ tripId, events }: RouteSectionProps) {
  const load = useCallback(() => getTripRoute(tripId), [tripId]);
  const { state, reload } = useApiResource(load);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const focusEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setFocusRequest({ eventId, requestedAt: Date.now() });
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const subtitle =
    state.status === "ready" && state.data.pointCount > 0
      ? [
          pluralize(state.data.pointCount, "GPS reading"),
          events.length > 0
            ? `${pluralize(events.length, "event")} marked`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "The path recorded during this trip";

  return (
    <section aria-labelledby="route-heading" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="route-heading" className="text-section font-semibold">
            Route
          </h2>
          <p className="mt-1 text-small text-muted-foreground">{subtitle}</p>
        </div>
        <ul
          aria-label="Map key"
          className="flex flex-wrap gap-x-4 gap-y-2 text-caption text-foreground-secondary"
        >
          {EVENT_TYPES.map((type) => (
            <li key={type} className="flex items-center gap-2">
              <EventGlyph type={type} />
              {EVENT_LABELS[type]}
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-6",
          events.length > 0 && "lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <div ref={mapRef} className="overflow-hidden rounded-lg border bg-card">
          {state.status === "loading" && (
            <Skeleton className={cn("w-full rounded-none", MAP_HEIGHT_CLASS)} />
          )}

          {state.status === "error" && (
            <MapMessage>
              <p>
                The route didn&rsquo;t load:{" "}
                {state.error instanceof Error
                  ? state.error.message
                  : "the server didn't respond"}
                .
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={reload}
              >
                Try again
              </Button>
            </MapMessage>
          )}

          {state.status === "ready" && state.data.path.length === 0 && (
            <MapMessage>
              <p>
                No GPS positions were recorded on this trip, so there&rsquo;s
                no route to draw.
              </p>
            </MapMessage>
          )}

          {state.status === "ready" && state.data.path.length > 0 && (
            <RouteMap
              path={state.data.path}
              events={events}
              selectedEventId={selectedEventId}
              focusRequest={focusRequest}
              onSelectEvent={setSelectedEventId}
            />
          )}
        </div>

        {events.length > 0 && (
          <ol
            aria-label="Events along the route"
            className="divide-y self-start overflow-hidden rounded-lg border bg-card lg:max-h-[28rem] lg:overflow-y-auto"
          >
            {events.map((event) => {
              const selected = event.id === selectedEventId;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => focusEvent(event.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 ease-standard hover:bg-muted/50",
                      selected && "bg-muted hover:bg-muted",
                    )}
                  >
                    <EventGlyph type={event.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium">
                        {EVENT_LABELS[event.type]}
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        {describeEventMeasurement(event)} ·{" "}
                        {severityLabel(event.severity)}
                      </span>
                    </span>
                    <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                      {formatClockTimeWithSeconds(event.timestamp)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

function MapMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center text-body text-foreground-secondary",
        MAP_HEIGHT_CLASS,
      )}
    >
      {children}
    </div>
  );
}
