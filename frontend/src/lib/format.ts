const MPS_TO_KMH = 3.6;

export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function toKmh(metresPerSecond: number): number {
  return metresPerSecond * MPS_TO_KMH;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClockTimeWithSeconds(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function pluralize(count: number, noun: string): string {
  return `${count.toLocaleString()} ${count === 1 ? noun : `${noun}s`}`;
}
