
export interface HolidayItem {
  date: string;
  name: string;
}

export const NATIONAL_HOLIDAYS_2026: HolidayItem[] = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-29', name: 'Good Friday' },
  { date: '2026-04-14', name: 'Dr Ambedkar Jayanti / Baisakhi' },
  { date: '2026-05-01', name: 'Maharashtra Day / Labour Day' },
  { date: '2026-06-17', name: 'Eid ul-Adha (tentative)' },
  { date: '2026-07-17', name: 'Muharram (tentative)' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-09-16', name: 'Milad-un-Nabi (tentative)' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-24', name: 'Dussehra' },
  { date: '2026-11-04', name: 'Diwali (Lakshmi Puja)' },
  { date: '2026-11-05', name: 'Diwali (Bali Pratipada)' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

export const NATIONAL_HOLIDAY_DATES_2026: string[] = NATIONAL_HOLIDAYS_2026.map(h => h.date);

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return new Date(year, month - 1, day, 12, 0, 0); // Noon local time avoids DST/timezone shifts
}

export function formatToDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isWorkingDay(dateStr: string, companyHolidays: string[] = []): boolean {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Sunday or Saturday
  if (NATIONAL_HOLIDAY_DATES_2026.includes(dateStr)) return false;
  if (companyHolidays.includes(dateStr)) return false;
  return true;
}

export function getNonWorkingReason(dateStr: string, companyHolidays: string[] = []): string | null {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  if (day === 0) return 'Sunday';
  if (day === 6) return 'Saturday';
  const holiday = NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStr);
  if (holiday) return holiday.name;
  if (companyHolidays.includes(dateStr)) return 'Company Holiday';
  return null;
}

export function countWorkingDays(
  startDateStr: string,
  endDateStr: string,
  companyHolidays: string[] = []
): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end.getTime() < start.getTime()) return -1; // Flag for inverted date range

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

export function getWorkingDates(
  startDateStr: string,
  endDateStr: string,
  companyHolidays: string[] = []
): string[] {
  if (!startDateStr || !endDateStr) return [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() < start.getTime()) return [];

  const workingDates: string[] = [];
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

export interface SkippedDateItem {
  date: string;
  reason: string;
}

export function getNonWorkingDates(
  startDateStr: string,
  endDateStr: string,
  companyHolidays: string[] = []
): SkippedDateItem[] {
  if (!startDateStr || !endDateStr) return [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() < start.getTime()) return [];

  const skipped: SkippedDateItem[] = [];
  const current = new Date(start);
  while (current.getTime() <= end.getTime()) {
    const curStr = formatToDateStr(current);
    const reason = getNonWorkingReason(curStr, companyHolidays);
    if (reason) {
      skipped.push({ date: curStr, reason });
    }
    current.setDate(current.getDate() + 1);
  }
  return skipped;
}

export { formatDate } from './date';
