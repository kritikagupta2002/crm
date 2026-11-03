import { db } from './db.js';
import { parseDate, eachDay } from './dates.js';
import { offDaysFromLabel, markedDays } from '../../src/hrms/modules/leave/utils/workingDays.js';

/*
 * Working days for a person: not their weekly off (from their shift assignment) and not a holiday. Holidays and
 * half days are only the days HR / Admin mark on the attendance calendar (Leave settings → companyHolidays).
 */
export const calendarDays = () => markedDays((db.get('leave_settings') || {}).companyHolidays || []);

export function holidaySet() {
  return new Set(calendarDays().filter((h) => h.kind === 'Holiday').map((h) => h.date));
}

export function halfDaySet() {
  return new Set(calendarDays().filter((h) => h.kind === 'Half Day').map((h) => h.date));
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

/* Leave days a date range uses: each working day counts 1, a marked half day 0.5. */
export function leaveDaysIn(employeeId, start, end) {
  const half = halfDaySet();
  return workingDates(employeeId, start, end).reduce((sum, d) => sum + (half.has(d) ? 0.5 : 1), 0);
}

/* The first day anyone recorded attendance in the portal; days before it carry no attendance data. */
export function firstRecordedDay() {
  return db.get('attendance').reduce((min, a) => (a.date && (!min || a.date < min) ? a.date : min), '');
}
