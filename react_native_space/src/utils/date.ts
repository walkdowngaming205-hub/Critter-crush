const pad = (n: number): string => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function yesterdayKey(d: Date = new Date()): string {
  const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return dateKey(y);
}

export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.ceil((ms ?? 0) / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor((ms ?? 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${pad(h)}:${pad(m)}:${pad(total % 60)}`;
}

export function prettyDate(d: Date = new Date()): string {
  try {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateKey(d);
  }
}
