import { INITIAL_EMPLOYEES } from '../employees/employees.js';
import { INITIAL_SHIFT_ASSIGNMENTS, INITIAL_SHIFTS } from '../shifts/shifts.js';
import { offDaysFromLabel } from '../../modules/leave/utils/workingDays.js';

/*
 * The biometric register for the last four weeks up to today, for everyone on the rolls, so the HR pages' "today"
 * is today (the register used to stop on a fixed date). Each person's weekly off (from their shift) has no entry. The same person and day always get the
 * same entry, so the figures don't change between visits.
 */
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clock = (mins) => `${pad(((Math.floor(mins / 60) + 11) % 12) + 1)}:${pad(mins % 60)} ${mins >= 720 ? 'PM' : 'AM'}`;
const duration = (mins) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
const IN_FIELD = /Geology|GIS|Hydro|Mining/;

const offDaysOf = (employeeId) => {
    const assignment = INITIAL_SHIFT_ASSIGNMENTS.find((a) => a.employeeId === employeeId);
    return offDaysFromLabel(assignment?.weeklyOff ?? INITIAL_SHIFTS.find((s) => s.id === assignment?.shiftId)?.weeklyOff);
};

function buildRegister() {
    const records = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    for (let back = 0; back < 28; back++) {
        const day = new Date(today);
        day.setDate(day.getDate() - back);
        // Before 9 am nobody has punched in yet today.
        if (back === 0 && nowMins < 540)
            continue;
        const date = isoOf(day);
        INITIAL_EMPLOYEES.forEach((emp, i) => {
            if (offDaysOf(emp.employeeId).includes(day.getDay()))
                return;
            const n = (i * 37 + day.getDate() * 11 + day.getMonth() * 7) % 100;
            const field = IN_FIELD.test(emp.employment.department) && n % 3 === 0;
            const base = {
                id: `att-${date}-${emp.employeeId}`,
                employeeId: emp.employeeId,
                employeeName: emp.name,
                department: emp.employment.department,
                date,
                overtime: '-',
                punchSource: field ? 'Mobile Punch (Field GPS)' : 'Biometric - Jaipur HQ',
            };
            if (n < 4) {
                records.push({ ...base, checkIn: '-', checkOut: '-', workingHours: '-', lateBy: '-', status: 'Absent' });
                return;
            }
            if (n < 8) {
                records.push({ ...base, checkIn: '-', checkOut: '-', workingHours: '-', lateBy: '-', status: 'On Leave', punchSource: 'Approved leave' });
                return;
            }
            const late = n < 18;
            const inAt = late ? 555 + (n % 30) : 525 + (n % 20);
            const outAt = 1080 + ((n * 3) % 45);
            const working = back === 0 && nowMins < outAt;
            records.push({
                ...base,
                checkIn: clock(inAt),
                checkOut: working ? '-' : clock(outAt),
                workingHours: working ? 'Working...' : duration(outAt - inAt),
                lateBy: late ? `${inAt - 540}m` : '-',
                overtime: !working && outAt - inAt > 555 ? `${outAt - inAt - 540}m` : '-',
                status: late ? 'Late' : 'Present',
            });
        });
    }
    return records;
}

export const INITIAL_ATTENDANCE = buildRegister();
export const INITIAL_CORRECTIONS = [
    {
        id: 'cor-01',
        employeeId: 'BGS/10',
        employeeName: 'Vishal Kumawat',
        department: 'Mineral Exploration',
        date: '2026-10-21',
        currentCheckIn: '10:45 AM',
        currentCheckOut: '06:15 PM',
        requestedCheckIn: '09:00 AM',
        requestedCheckOut: '06:15 PM',
        reason: 'Topographical survey field work in Bhilwara had weak cellular reception; GPS punch synced late.',
        status: 'Pending',
        appliedDate: '2026-10-22',
    },
    {
        id: 'cor-02',
        employeeId: 'BGS/04',
        employeeName: 'Vikas Verma',
        department: 'Mining & Survey',
        date: '2026-10-18',
        currentCheckIn: '08:50 AM',
        currentCheckOut: '-',
        requestedCheckIn: '08:50 AM',
        requestedCheckOut: '07:30 PM',
        reason: 'Mine pit boundary demarcation; missed punch-out due to joint inspection with client.',
        status: 'Approved',
        appliedDate: '2026-10-19',
        reviewedBy: 'Inder Nogiya',
        reviewComment: 'Verified with site supervisor GPS log.',
    },
    {
        id: 'cor-03',
        employeeId: 'BGS/09',
        employeeName: 'Balveer Singh Yadav',
        department: 'Mineral Exploration',
        date: '2026-10-24',
        currentCheckIn: '08:55 AM',
        currentCheckOut: '06:00 PM',
        requestedCheckIn: '08:55 AM',
        requestedCheckOut: '07:15 PM',
        reason: 'Extended geological core box cataloging and assay dispatch at field camp.',
        status: 'Pending',
        appliedDate: '2026-10-25',
    }
];
