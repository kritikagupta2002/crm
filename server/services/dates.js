/*
 * Calendar dates for the business, in India time. The server's process time zone is set to Asia/Kolkata in
 * config.js, so local Date methods give IST. Never use toISOString() for a calendar date: it returns the UTC
 * day, which is yesterday between midnight and 05:30 IST.
 */
const pad = (n) => String(n).padStart(2, '0');

export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());
export const thisMonth = () => today().slice(0, 7);

/* Parses 'YYYY-MM-DD' as a local date at noon, which is safe from DST and time-zone shifts. */
export const parseDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/* Every calendar date from start to end inclusive, as 'YYYY-MM-DD'. */
export function eachDay(start, end) {
  const out = [];
  for (let d = parseDate(start); isoDate(d) <= end; d.setDate(d.getDate() + 1)) out.push(isoDate(d));
  return out;
}
