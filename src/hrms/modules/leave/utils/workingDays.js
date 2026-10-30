/**
 * workingDays.ts
 * Single source of truth for leave duration and working day calculations.
 *
 * Rules:
 *  - Skip the person's weekly off days (from their shift assignment; Saturday & Sunday when not given)
 *  - Skip the public holidays below and the company holidays stored in LeaveSettings.companyHolidays
 *  - Pure string / local-date parsing to prevent timezone shift errors
 *
 * Used by: leave.service.js, ApplyLeavePage.jsx, the employee dashboard and the attendance register
 */
/** Public holidays for 2026 (the Islamic festivals move with the moon, so their dates are tentative). */
export const PUBLIC_HOLIDAYS_2026 = [
    { date: '2026-01-26', name: 'Republic Day', kind: 'National Holiday' },
    { date: '2026-04-03', name: 'Good Friday', kind: 'Gazetted Holiday' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', kind: 'Gazetted Holiday' },
    { date: '2026-05-01', name: 'Labour Day', kind: 'Holiday' },
    { date: '2026-05-27', name: 'Eid ul-Adha (tentative)', kind: 'Gazetted Holiday' },
    { date: '2026-06-26', name: 'Muharram (tentative)', kind: 'Gazetted Holiday' },
    { date: '2026-08-15', name: 'Independence Day', kind: 'National Holiday' },
    { date: '2026-08-26', name: 'Milad-un-Nabi (tentative)', kind: 'Gazetted Holiday' },
    { date: '2026-10-02', name: 'Gandhi Jayanti', kind: 'National Holiday' },
    { date: '2026-10-20', name: 'Dussehra', kind: 'Gazetted Holiday' },
    { date: '2026-11-08', name: 'Diwali', kind: 'Gazetted Holiday' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', kind: 'Gazetted Holiday' },
    { date: '2026-12-25', name: 'Christmas Day', kind: 'Gazetted Holiday' },
];
export const NATIONAL_HOLIDAYS_2026 = PUBLIC_HOLIDAYS_2026.map((h) => h.date);
const DEFAULT_OFF_DAYS = [0, 6];
const DAY_NUMBERS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
/** "Saturday & Sunday" → [6, 0]; "Sunday" → [0]; a rotational off (no fixed day) → []. */
export function offDaysFromLabel(label) {
    if (!label) return DEFAULT_OFF_DAYS;
    if (/rotational/i.test(label)) return [];
    const days = Object.entries(DAY_NUMBERS).filter(([name]) => label.toLowerCase().includes(name)).map(([, n]) => n);
    return days.length ? days : DEFAULT_OFF_DAYS;
}
/** Company holidays may be saved as dates or as { date, name }. */
const holidayDates = (companyHolidays = []) => companyHolidays.map((h) => (typeof h === 'string' ? h : h?.date)).filter(Boolean);
/**
 * Parse a 'YYYY-MM-DD' string safely into a Date object in local time
 */
export function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Noon local time avoids DST/timezone shifts
}
/**
 * Format a Date object to 'YYYY-MM-DD'
 */
export function formatToDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * Returns true if the date is a working day: not a weekly off day, not a public holiday and not a
 * company holiday.
 */
export function isWorkingDay(dateStr, companyHolidays = [], offDays = DEFAULT_OFF_DAYS) {
    const date = parseLocalDate(dateStr);
    if (offDays.includes(date.getDay()))
        return false;
    if (NATIONAL_HOLIDAYS_2026.includes(dateStr))
        return false;
    if (holidayDates(companyHolidays).includes(dateStr))
        return false;
    return true;
}
/**
 * Count the number of working days between startDate and endDate (inclusive).
 * Returns -1 if end < start.
 *
 * @param startDateStr  YYYY-MM-DD
 * @param endDateStr    YYYY-MM-DD
 * @param companyHolidays  Optional list of additional YYYY-MM-DD holiday dates
 */
export function countWorkingDays(startDateStr, endDateStr, companyHolidays = [], offDays = DEFAULT_OFF_DAYS) {
    if (!startDateStr || !endDateStr)
        return 0;
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
        return 0;
    if (end.getTime() < start.getTime())
        return -1; // Flag for inverted date range
    let count = 0;
    const current = new Date(start);
    while (current.getTime() <= end.getTime()) {
        const curStr = formatToDateStr(current);
        if (isWorkingDay(curStr, companyHolidays, offDays)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
/**
 * Get all individual working dates (YYYY-MM-DD) within a range.
 * Useful for attendance synchronization.
 */
export function getWorkingDates(startDateStr, endDateStr, companyHolidays = [], offDays = DEFAULT_OFF_DAYS) {
    if (!startDateStr || !endDateStr)
        return [];
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() < start.getTime())
        return [];
    const workingDates = [];
    const current = new Date(start);
    while (current.getTime() <= end.getTime()) {
        const curStr = formatToDateStr(current);
        if (isWorkingDay(curStr, companyHolidays, offDays)) {
            workingDates.push(curStr);
        }
        current.setDate(current.getDate() + 1);
    }
    return workingDates;
}
/**
 * Get the list of all non-working dates within a range (weekends + holidays).
 * Used for displaying skipped days in the UI.
 */
export function getNonWorkingDates(startDateStr, endDateStr, companyHolidays = [], offDays = DEFAULT_OFF_DAYS) {
    if (!startDateStr || !endDateStr)
        return [];
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() < start.getTime())
        return [];
    const skipped = [];
    const current = new Date(start);
    while (current.getTime() <= end.getTime()) {
        const curStr = formatToDateStr(current);
        if (!isWorkingDay(curStr, companyHolidays, offDays)) {
            skipped.push(curStr);
        }
        current.setDate(current.getDate() + 1);
    }
    return skipped;
}
/**
 * Format a date string YYYY-MM-DD to a human-friendly display.
 */
export function formatDate(dateStr) {
    if (!dateStr)
        return '';
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
