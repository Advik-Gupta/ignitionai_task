const MPS_TO_KMH = 3.6;

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function toKmh(metresPerSecond: number): number {
  return metresPerSecond * MPS_TO_KMH;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

/** pluralize(1, 'reading') -> "1 reading", pluralize(3, 'reading') -> "3 readings" */
export function pluralize(count: number, noun: string): string {
  return `${count.toLocaleString()} ${count === 1 ? noun : `${noun}s`}`;
}
