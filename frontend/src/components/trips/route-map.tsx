"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  EVENT_LABELS,
  EVENT_MARKER_LETTERS,
  describeEventMeasurement,
  severityLabel,
} from "@/lib/events";
import { formatClockTimeWithSeconds } from "@/lib/format";
import type { TripEvent, TripEventType } from "@/lib/trip-api";

const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSM_MAX_ZOOM = 19;
const SINGLE_POINT_ZOOM = 16;
const FOCUS_ZOOM = 17;
const FIT_PADDING: L.PointTuple = [32, 32];
const MARKER_SIZE = 24;

export type FocusRequest = {
  eventId: string;
  requestedAt: number;
};

type RouteMapProps = {
  path: Array<[number, number]>;
  events: TripEvent[];
  selectedEventId: string | null;
  focusRequest: FocusRequest | null;
  onSelectEvent: (eventId: string) => void;
};

const iconCache = new Map<string, L.DivIcon>();

function eventIcon(type: TripEventType, selected: boolean): L.DivIcon {
  const key = `${type}:${selected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "trip-event-marker",
    html: `<span data-type="${type}" data-selected="${selected}">${EVENT_MARKER_LETTERS[type]}</span>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2 - 2],
  });
  iconCache.set(key, icon);
  return icon;
}

function FocusOnRequest({
  focusRequest,
  markers,
}: {
  focusRequest: FocusRequest | null;
  markers: RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusRequest) return;
    const marker = markers.current.get(focusRequest.eventId);
    if (!marker) return;

    const target = marker.getLatLng();
    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      map.setView(target, zoom, { animate: false });
    } else {
      map.flyTo(target, zoom, { duration: 0.6 });
    }
    marker.openPopup();
  }, [focusRequest, map, markers]);

  return null;
}

export function RouteMap({
  path,
  events,
  selectedEventId,
  focusRequest,
  onSelectEvent,
}: RouteMapProps) {
  const markers = useRef(new Map<string, L.Marker>());
  const bounds = useMemo(() => L.latLngBounds(path), [path]);
  const hasLine = path.length > 1;
  const start = path[0];
  const end = path[path.length - 1];

  return (
    <MapContainer
      className="trip-map h-80 w-full sm:h-[28rem]"
      bounds={hasLine ? bounds : undefined}
      boundsOptions={hasLine ? { padding: FIT_PADDING } : undefined}
      center={hasLine ? undefined : start}
      zoom={hasLine ? undefined : SINGLE_POINT_ZOOM}
      scrollWheelZoom={false}
    >
      <TileLayer
        url={OSM_TILE_URL}
        attribution={OSM_ATTRIBUTION}
        maxZoom={OSM_MAX_ZOOM}
      />

      {hasLine && (
        <Polyline
          positions={path}
          pathOptions={{
            className: "trip-route-line",
            weight: 3,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      <CircleMarker
        center={start}
        radius={6}
        pathOptions={{ className: "trip-route-start", weight: 2 }}
      >
        <Tooltip direction="top" offset={[0, -6]}>
          Start
        </Tooltip>
      </CircleMarker>

      {hasLine && (
        <CircleMarker
          center={end}
          radius={6}
          pathOptions={{ className: "trip-route-end", weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            End
          </Tooltip>
        </CircleMarker>
      )}

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={eventIcon(event.type, event.id === selectedEventId)}
          title={EVENT_LABELS[event.type]}
          alt={EVENT_LABELS[event.type]}
          ref={(marker) => {
            if (marker) markers.current.set(event.id, marker);
            else markers.current.delete(event.id);
          }}
          eventHandlers={{ click: () => onSelectEvent(event.id) }}
        >
          <Popup>
            <p className="text-small font-semibold">
              {EVENT_LABELS[event.type]}
            </p>
            <p className="text-small">{describeEventMeasurement(event)}</p>
            <p className="text-caption text-muted-foreground">
              {severityLabel(event.severity)} ·{" "}
              {formatClockTimeWithSeconds(event.timestamp)}
            </p>
          </Popup>
        </Marker>
      ))}

      <FocusOnRequest focusRequest={focusRequest} markers={markers} />
    </MapContainer>
  );
}
