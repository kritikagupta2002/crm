/* Dates as local calendar days, as the web CRM handles them (no time zone shifts). */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value) {
  const [y, m, d] = String(value).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* 06 Oct 2026 */
export const formatDate = (value) => {
  const date = parseISODate(value)
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/* 06 Oct */
export const formatDayMonth = (value) => {
  const date = parseISODate(value)
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`
}
