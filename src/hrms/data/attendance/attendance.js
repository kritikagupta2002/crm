import { INITIAL_EMPLOYEES } from '../employees/employees';

/*
 * The biometric register for the last four weeks up to today, for everyone on the rolls, so the HR pages' "today"
 * is today (the register used to stop on a fixed date). Sundays are off. The same person and day always get the
 * same entry, so the figures don't change between visits.
 */
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clock = (mins) => `${pad(((Math.floor(mins / 60) + 11) % 12) + 1)}:${pad(mins % 60)} ${mins >= 720 ? 'PM' : 'AM'}`;
const duration = (mins) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
const IN_FIELD = /Geology|GIS|Hydro|Mining/;

function buildRegister() {
    const records = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    for (let back = 0; back < 28; back++) {
        const day = new Date(today);
        day.setDate(day.getDate() - back);
        if (day.getDay() === 0)
            continue;
        // Before 9 am nobody has punched in yet today.
        if (back === 0 && nowMins < 540)
            continue;
        const date = isoOf(day);
        INITIAL_EMPLOYEES.forEach((emp, i) => {
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
        employeeId: 'BGS-007',
        employeeName: 'Ravi Gurjar',
        department: 'GIS, Remote Sensing & UAV',
        date: '2026-09-16',
        currentCheckIn: '10:45 AM',
        currentCheckOut: '06:15 PM',
        requestedCheckIn: '09:00 AM',
        requestedCheckOut: '06:15 PM',
        reason: 'Drone field takeoff in Bhilwara had poor cell reception; biometric couldn’t sync until 10:45 AM.',
        status: 'Pending',
        appliedDate: '2026-09-17',
    },
    {
        id: 'cor-02',
        employeeId: 'BGS-006',
        employeeName: 'Rohan Deshmukh',
        department: 'Geology & Mineral Exploration',
        date: '2026-09-14',
        currentCheckIn: '08:50 AM',
        currentCheckOut: '-',
        requestedCheckIn: '08:50 AM',
        requestedCheckOut: '07:30 PM',
        reason: 'Core logging deep drill hole at mine pit; missed out-punch due to emergency shift extension.',
        status: 'Approved',
        appliedDate: '2026-09-15',
        reviewedBy: 'Rajesh Sharma',
        reviewComment: 'Verified with shift supervisor log.',
    },
    {
        id: 'cor-03',
        employeeId: 'BGS-006',
        employeeName: 'Rohan Deshmukh',
        department: 'Geology & Mineral Exploration',
        date: '2026-09-17',
        currentCheckIn: '08:55 AM',
        currentCheckOut: '06:00 PM',
        requestedCheckIn: '08:55 AM',
        requestedCheckOut: '07:15 PM',
        reason: 'Extended core box inspection and assay sample cataloging at mine warehouse.',
        status: 'Pending',
        appliedDate: '2026-09-18',
    }
];
