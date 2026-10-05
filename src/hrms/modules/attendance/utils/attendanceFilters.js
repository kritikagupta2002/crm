/**
 * Attendance Filtering Helpers for Date | Day | Month modes
 */

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Safely parse 'YYYY-MM-DD' into local date without UTC offset shifting
 */
export function parseIsoDate(isoString) {
  if (!isoString || typeof isoString !== 'string') return null;
  const parts = isoString.split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

/**
 * Get weekday string in English (e.g. 'Monday') from YYYY-MM-DD
 */
export function getDayOfWeekFromIso(isoString) {
  const d = parseIsoDate(isoString);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Filter attendance records based on mode: Date | Day | Month
 */
export function filterAttendanceRecords(records = [], options = {}) {
  const {
    mode = 'date',
    date = '',
    day = 'Monday',
    month = '',
    department = 'all',
    project = 'all',
    status = 'all',
    punchSource = 'all',
    getProjectFn,
  } = options;

  return records.filter((r) => {
    // 1. Mode condition
    if (mode === 'date') {
      if (date && r.date !== date) return false;
    } else if (mode === 'day') {
      if (day) {
        const recordDay = getDayOfWeekFromIso(r.date);
        if (recordDay.toLowerCase() !== day.toLowerCase()) return false;
      }
    } else if (mode === 'month') {
      if (month) {
        if (!r.date || !r.date.startsWith(month)) return false;
      }
    }

    // 2. Department
    if (department && department !== 'all' && r.department !== department) {
      return false;
    }

    // 3. Project / Site
    if (project && project !== 'all' && getProjectFn) {
      const proj = getProjectFn(r.employeeId);
      if (proj !== project) return false;
    }

    // 4. Status
    if (status && status !== 'all' && r.status !== status) {
      return false;
    }

    // 5. Punch source
    if (punchSource && punchSource !== 'all') {
      if (!r.punchSource || !r.punchSource.toLowerCase().includes(punchSource.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Unified summary metrics calculation for filtered attendance dataset
 */
export function computeAttendanceMetrics(filteredRecords = [], totalStaff = 0) {
  const totalLogs = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const lateCount = filteredRecords.filter((r) => r.lateBy && r.lateBy !== '-').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;
  const onLeaveCount = filteredRecords.filter((r) => r.status === 'On Leave').length;

  const presentPercent = totalLogs > 0 ? ((presentCount / totalLogs) * 100).toFixed(1) : '0';
  const absentPercent = totalLogs > 0 ? ((absentCount / totalLogs) * 100).toFixed(1) : '0';
  const latePercent = totalLogs > 0 ? ((lateCount / totalLogs) * 100).toFixed(1) : '0';

  return {
    totalLogs,
    presentCount,
    lateCount,
    absentCount,
    onLeaveCount,
    presentPercent,
    absentPercent,
    latePercent,
  };
}
