// A "day" runs 04:00–03:59 local time so late-night sessions count for the evening before.
const BOUNDARY_HOUR = 4;
const pad = n => String(n).padStart(2, '0');

export function dayKey(date = new Date()) {
  const d = new Date(date.getTime() - BOUNDARY_HOUR * 3600_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Date math in UTC on the key itself, so DST shifts never skip or repeat a day.
const toUtc = key => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));

export function addDays(key, n) {
  return new Date(toUtc(key) + n * 86400_000).toISOString().slice(0, 10);
}

export const daysBetween = (a, b) => Math.round((toUtc(b) - toUtc(a)) / 86400_000);
