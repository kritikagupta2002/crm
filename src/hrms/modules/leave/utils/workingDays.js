export const NATIONAL_HOLIDAYS_2026 = [
    '2026-01-26', // Republic Day
    '2026-03-29', // Good Friday
    '2026-04-14', // Dr Ambedkar Jayanti / Baisakhi
    '2026-05-01', // Maharashtra Day / Labour Day
    '2026-06-17', // Eid ul-Adha (tentative)
    '2026-07-17', // Muharram (tentative)
    '2026-08-15', // Independence Day
    '2026-09-16', // Milad-un-Nabi (tentative)
    '2026-10-02', // Gandhi Jayanti
    '2026-10-24', // Dussehra
    '2026-11-04', // Diwali (Lakshmi Puja)
    '2026-11-05', // Diwali (Bali Pratipada)
    '2026-11-24', // Guru Nanak Jayanti
    '2026-12-25', // Christmas Day
];
export function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Noon local time avoids DST/timezone shifts
}
export function formatToDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
export function isWorkingDay(dateStr, companyHolidays = []) {
    const date = parseLocalDate(dateStr);
    const day = date.getDay();
    if (day === 0 || day === 6)
        return false; // Sunday or Saturday
    if (NATIONAL_HOLIDAYS_2026.includes(dateStr))
        return false;
    if (companyHolidays.includes(dateStr))
        return false;
    return true;
}
export function countWorkingDays(startDateStr, endDateStr, companyHolidays = []) {
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
        if (isWorkingDay(curStr, companyHolidays)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
export function getWorkingDates(startDateStr, endDateStr, companyHolidays = []) {
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
        if (isWorkingDay(curStr, companyHolidays)) {
            workingDates.push(curStr);
        }
        current.setDate(current.getDate() + 1);
    }
    return workingDates;
}
export function getNonWorkingDates(startDateStr, endDateStr, companyHolidays = []) {
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
        if (!isWorkingDay(curStr, companyHolidays)) {
            skipped.push(curStr);
        }
        current.setDate(current.getDate() + 1);
    }
    return skipped;
}
export function formatDate(dateStr) {
    if (!dateStr)
        return '';
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
