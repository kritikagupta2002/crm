
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function parseDateSafe(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = parseDateSafe(dateStr);
  if (!d) return String(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateOnly(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(iso);
  }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return `${d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return String(iso);
  }
}

export function formatDateIso(date: Date = new Date()): string {
  try {
    return date.toLocaleDateString('en-CA');
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function formatDateHeader(date: Date = new Date()): string {
  try {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return formatDate(formatDateIso(date));
  }
}

export function formatRelativeDays(
  iso?: string | null,
  now: number = Date.now()
): string {
  if (!iso) return '';
  try {
    const day = (t: string | number) =>
      new Date(new Date(t).toDateString()).getTime();
    const diff = Math.round((day(iso) - day(now)) / 86_400_000);
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff === -1) return 'yesterday';
    return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
  } catch {
    return String(iso);
  }
}
