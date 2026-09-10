export type Streak = {
  current: number;
  best: number;
  lastQualifyingDay: string | null;
};

const MS_PER_DAY = 86_400_000;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function toDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayIndex(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function computeStreak(qualifyingDays: string[], today: string): Streak {
  const days = [...new Set(qualifyingDays)].sort();
  if (days.length === 0) {
    return { current: 0, best: 0, lastQualifyingDay: null };
  }

  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index++) {
    const consecutive = dayIndex(days[index]) === dayIndex(days[index - 1]) + 1;
    run = consecutive ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const lastDay = days[days.length - 1];
  const daysSinceLast = dayIndex(today) - dayIndex(lastDay);

  return {
    current: daysSinceLast <= 1 ? run : 0,
    best,
    lastQualifyingDay: lastDay,
  };
}
