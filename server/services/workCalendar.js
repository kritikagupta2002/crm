import { db } from './db.js';
import { parseDate, eachDay } from './dates.js';
import { PUBLIC_HOLIDAYS_2026, offDaysFromLabel } from '../../src/hrms/modules/leave/utils/workingDays.js';

/*
 * Working days for a person: not their weekly off (from their shift assignment) and not a holiday. Holidays come
 * from Leave settings (public holidays plus company holidays), with the 2026 list as the default.
 */
export function holidaySet() {
  const settings = db.get('leave_settings') || {};
  const publicHolidays = Array.isArray(settings.publicHolidays) ? settings.publicHolidays : PUBLIC_HOLIDAYS_2026;
  return new Set([...publicHolidays, ...(settings.companyHolidays || [])].map((h) => (typeof h === 'string' ? h : h?.date)).filter(Boolean));
}

export function offDaysFor(employeeId) {
  const assignment = db.get('shift_assignments').find((a) => a.employeeId === employeeId && a.status !== 'Inactive');
  if (assignment?.weeklyOff) return offDaysFromLabel(assignment.weeklyOff);
  const shift = db.get('shifts').find((s) => s.id === assignment?.shiftId);
  return offDaysFromLabel(shift?.weeklyOff);
}

export function workingDates(employeeId, start, end, holidays = holidaySet()) {
  const off = offDaysFor(employeeId);
  return eachDay(start, end).filter((d) => !off.includes(parseDate(d).getDay()) && !holidays.has(d));
}

/* The first day anyone recorded attendance in the portal; days before it carry no attendance data. */
export function firstRecordedDay() {
  return db.get('attendance').reduce((min, a) => (a.date && (!min || a.date < min) ? a.date : min), '');
}
