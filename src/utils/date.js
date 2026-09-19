/* All dates are handled as local calendar days (no time zone shifts). */

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const formatDayMonth = (value) => {
  const date = parseISODate(value)
  return `${String(date.getDate()).padStart(2, '0')} ${monthShort(date)}`
}

export const formatLongDate = (date) =>
  date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

/* Fixed names: some browsers print "Sept" for en-GB. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const monthShort = (date) => MONTHS[date.getMonth()]

export function formatTime(value) {
  const [h, m] = value.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

/*
 * Returns { start, end } for the period (both dates inclusive).
 * Indian financial year: quarters are Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar; the year starts 1 April.
 */
export function periodRange(period, today, offset = 0) {
  const y = today.getFullYear()
  const m = today.getMonth()
  if (period === 'month') {
    return {
      start: new Date(y, m + offset, 1),
      end: new Date(y, m + offset + 1, 0),
    }
  }
  if (period === 'quarter') {
    const qStart = Math.floor(m / 3) * 3 + offset * 3
    return { start: new Date(y, qStart, 1), end: new Date(y, qStart + 3, 0) }
  }
  const fyStartYear = (m >= 3 ? y : y - 1) + offset
  return {
    start: new Date(fyStartYear, 3, 1),
    end: new Date(fyStartYear + 1, 2, 31),
  }
}

export const isInRange = (value, range) => {
  const date = parseISODate(value)
  return date >= range.start && date <= range.end
}
