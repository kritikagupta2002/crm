import { AttendanceCorrection, AttendanceRecord, Employee } from '../types/hrms';
import { INITIAL_EMPLOYEES } from './seeds';

export const STANDARD_DEPARTMENTS = [
  'Geology & Mineral Exploration',
  'Mining & Mine Planning',
  'GIS, Remote Sensing & UAV',
  'Hydrogeology & Groundwater',
  'Finance & Mineral Economics',
  'Human Resources & Admin',
];

export const STANDARD_PROJECTS = [
  'Bhilwara Lead-Zinc Core Drilling',
  'Jaipur Ring Road Drone Photogrammetry',
  'Khetri Copper Belt Reconnaissance',
  'Udaipur Rock Phosphate Assessment',
  'Corporate Operations & Governance',
];

export const PROJECT_BY_EMPLOYEE: Record<string, string> = {
  'BGS-2021-001': 'Corporate Operations & Governance',
  'BGS-2021-009': 'Corporate Operations & Governance',
  'BGS-2022-011': 'Corporate Operations & Governance',
  'BGS-2022-018': 'Bhilwara Lead-Zinc Core Drilling',
  'BGS-2023-044': 'Bhilwara Lead-Zinc Core Drilling',
  'BGS-001': 'Corporate Operations & Governance',
  'BGS-002': 'Corporate Operations & Governance',
  'BGS-003': 'Bhilwara Lead-Zinc Core Drilling',
  'BGS-004': 'Corporate Operations & Governance',
  'BGS-005': 'Jaipur Ring Road Drone Photogrammetry',
  'BGS-006': 'Bhilwara Lead-Zinc Core Drilling',
  'BGS-007': 'Jaipur Ring Road Drone Photogrammetry',
  'BGS-008': 'Udaipur Rock Phosphate Assessment',
  'BGS-009': 'Khetri Copper Belt Reconnaissance',
  'BGS-010': 'Corporate Operations & Governance',
};

export function getEmployeeProjectById(employeeId: string): string {
  return PROJECT_BY_EMPLOYEE[employeeId] || 'Bhilwara Lead-Zinc Core Drilling';
}

export const INITIAL_CORRECTIONS: AttendanceCorrection[] = [
  {
    id: 'cor-01',
    employeeId: 'BGS-2023-044',
    employeeName: 'Neha Gupta',
    department: 'Geology & Mineral Exploration',
    date: '2026-09-16',
    currentCheckIn: '10:45 AM',
    currentCheckOut: '06:15 PM',
    requestedIn: '09:00 AM',
    requestedOut: '06:15 PM',
    requestedCheckIn: '09:00 AM',
    requestedCheckOut: '06:15 PM',
    reason: 'Drone field takeoff in Bhilwara had poor cell reception; biometric could not sync until 10:45 AM.',
    status: 'Pending',
    appliedDate: '2026-09-17',
    appliedAt: '2026-09-17',
  },
  {
    id: 'cor-02',
    employeeId: 'BGS-2022-018',
    employeeName: 'Vikram Patel',
    department: 'Geology & Mineral Exploration',
    date: '2026-09-14',
    currentCheckIn: '08:50 AM',
    currentCheckOut: '-',
    requestedIn: '08:50 AM',
    requestedOut: '07:30 PM',
    requestedCheckIn: '08:50 AM',
    requestedCheckOut: '07:30 PM',
    reason: 'Core logging deep drill hole at mine pit; missed out-punch due to emergency shift extension.',
    status: 'Approved',
    appliedDate: '2026-09-15',
    appliedAt: '2026-09-15',
    reviewedBy: 'Rajesh Sharma',
    reviewComment: 'Verified with shift supervisor log.',
    hrRemarks: 'Verified with shift supervisor log.',
  },
  {
    id: 'cor-03',
    employeeId: 'BGS-2023-044',
    employeeName: 'Neha Gupta',
    department: 'Geology & Mineral Exploration',
    date: '2026-09-17',
    currentCheckIn: '08:55 AM',
    currentCheckOut: '06:00 PM',
    requestedIn: '08:55 AM',
    requestedOut: '07:15 PM',
    requestedCheckIn: '08:55 AM',
    requestedCheckOut: '07:15 PM',
    reason: 'Extended core box inspection and assay sample cataloging at mine warehouse.',
    status: 'Pending',
    appliedDate: '2026-09-18',
    appliedAt: '2026-09-18',
  },
];

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clock = (mins: number) =>
  `${pad(((Math.floor(mins / 60) + 11) % 12) + 1)}:${pad(mins % 60)} ${mins >= 720 ? 'PM' : 'AM'}`;
const durationStr = (mins: number) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;

export function buildSeededAttendance(employees: Employee[] = INITIAL_EMPLOYEES): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  for (let back = 0; back < 28; back++) {
    const day = new Date(today);
    day.setDate(day.getDate() - back);
    if (day.getDay() === 0) continue; // Sundays are weekly off
    const date = isoOf(day);

    employees.forEach((emp, i) => {
      const n = (i * 37 + day.getDate() * 11 + (day.getMonth() + 1) * 7) % 100;
      const isFieldDept = /Geology|Mining|GIS/.test(emp.employment?.department || '');
      const isFieldLocation =
        (emp.employment?.workLocation?.includes('Field') ||
          emp.employment?.workLocation?.includes('Bhilwara') ||
          emp.employment?.workLocation?.includes('Rig')) ??
        false;
      const isField = (isFieldDept && n % 3 === 0) || isFieldLocation;

      const punchSource = isField ? 'Mobile Punch (Field GPS)' : 'Biometric - Jaipur HQ';
      const workLocation = isField ? 'Bhilwara Exploration Camp' : (emp.employment?.workLocation || 'Jaipur Corporate HQ');

      const base: Partial<AttendanceRecord> = {
        id: `att-${date}-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.employment?.department || 'Operations',
        date,
        punchSource,
        workLocation,
        coordinates: isField ? { latitude: 25.3476, longitude: 74.6408 } : { latitude: 26.9124, longitude: 75.7873 },
      };

      if (n < 4) {
        records.push({
          ...(base as any),
          checkIn: '-',
          checkOut: '-',
          punchIn: '-',
          punchOut: '-',
          durationHours: 0,
          workingHours: '-',
          lateBy: '-',
          overtime: '-',
          status: 'Absent',
        });
        return;
      }

      if (n < 8) {
        records.push({
          ...(base as any),
          checkIn: '-',
          checkOut: '-',
          punchIn: '-',
          punchOut: '-',
          durationHours: 0,
          workingHours: '-',
          lateBy: '-',
          overtime: '-',
          status: 'On Leave',
          punchSource: 'Approved leave',
        });
        return;
      }

      const late = n < 18;
      const inAt = late ? 555 + (n % 30) : 525 + (n % 20); // 09:15+ vs 08:45-09:05
      const outAt = 1080 + ((n * 3) % 45); // 06:00 PM - 06:45 PM
      const isWorkingNow = back === 0 && nowMins < outAt;
      const diffMins = outAt - inAt;
      const hrs = parseFloat((diffMins / 60).toFixed(1));

      let recordStatus: AttendanceRecord['status'] = 'Present';
      if (isField) {
        recordStatus = 'Field Duty';
      } else if (late) {
        recordStatus = 'Late';
      } else if (hrs < 4) {
        recordStatus = 'Absent';
      } else if (hrs < 8) {
        recordStatus = 'Half-Day';
      }

      records.push({
        ...(base as any),
        checkIn: clock(inAt),
        checkOut: isWorkingNow ? '-' : clock(outAt),
        punchIn: clock(inAt),
        punchOut: isWorkingNow ? '-' : clock(outAt),
        durationHours: isWorkingNow ? parseFloat(((nowMins - inAt) / 60).toFixed(1)) : hrs,
        workingHours: isWorkingNow ? 'Working...' : durationStr(diffMins),
        lateBy: late ? `${inAt - 540}m` : '-',
        overtime: !isWorkingNow && diffMins > 555 ? `${diffMins - 540}m` : '-',
        status: recordStatus,
      });
    });
  }

  return records;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '-') return 0;
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return 0;
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const period = parts[1].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function calculateDurationFromTimes(inTime: string, outTime: string) {
  const inMins = parseTimeToMinutes(inTime);
  const outMins = parseTimeToMinutes(outTime);
  if (!inMins || !outMins || outMins <= inMins) {
    return { durationHours: 0, workingHours: '-', overtime: '-' };
  }
  const diff = outMins - inMins;
  const hours = parseFloat((diff / 60).toFixed(1));
  const workingHours = durationStr(diff);
  const overtime = diff > 540 ? `${diff - 540}m` : '-';
  return { durationHours: hours, workingHours, overtime };
}

export function getAttendanceMetrics(
  employees: Employee[],
  attendance: AttendanceRecord[],
  leaves: any[] = [],
  corrections: AttendanceCorrection[] = []
) {
  const todayStr = isoOf(new Date());
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const totalStaff = employees.length;

  const presentCount = todayRecords.filter(
    (a) => a.status === 'Present' || a.status === 'Field Duty' || a.status === 'Late'
  ).length;

  const leaveCount = leaves.filter((l) => l.status === 'Approved').length;
  const absentCount = Math.max(0, totalStaff - presentCount - leaveCount);
  const lateCount = todayRecords.filter((a) => a.status === 'Late' || (a.lateBy && a.lateBy !== '-')).length;

  const fieldCount = employees.filter(
    (e) =>
      e.employment?.workLocation?.includes('Field') ||
      e.employment?.workLocation?.includes('Bhilwara') ||
      e.employment?.workLocation?.includes('Site') ||
      e.employment?.workLocation?.includes('Camp')
  ).length;

  const pendingCorrections = corrections.filter((c) => c.status === 'Pending').length;
  const presentPct = totalStaff > 0 ? ((presentCount / totalStaff) * 100).toFixed(1) : '0';
  const absentPct = totalStaff > 0 ? ((absentCount / totalStaff) * 100).toFixed(1) : '0';

  return {
    totalStaff,
    presentCount,
    absentCount,
    leaveCount,
    lateCount,
    fieldCount,
    pendingCorrections,
    presentPct,
    absentPct,
  };
}
