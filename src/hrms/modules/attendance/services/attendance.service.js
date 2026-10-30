import { storage } from '@/core/storage/storage';
import { evaluateDay, nowClock, parseClock, todayIso } from '@/modules/attendance/utils/punch';

const later = (value, ms = 80) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const attendanceService = {
    getAttendance: async () => later(storage.getAttendance()),

    /*
     * A punch from the web portal. Punch In opens today's entry (late or on time by the attendance
     * settings); Punch Out closes it and works out the hours. The source says where it came from; the
     * portal does not read the phone's location.
     */
    recordPunch: async (employeeId, punchType, source = 'Web portal') => {
        if (!employeeId) throw new Error('Your HR record is not set up, so attendance cannot be recorded.');
        const list = storage.getAttendance();
        const today = todayIso();
        const settings = storage.getAttendanceSettings();
        const time = nowClock();
        let record = list.find((a) => a.employeeId === employeeId && a.date === today);
        if (record?.status === 'On Leave') throw new Error('You are on approved leave today.');

        if (punchType === 'checkIn') {
            if (record && record.checkIn && record.checkIn !== '-') throw new Error(`You already punched in at ${record.checkIn}.`);
            const emp = storage.getEmployees().find((e) => e.employeeId === employeeId);
            const day = evaluateDay(time, null, settings);
            const fresh = {
                id: `att-p-${Date.now()}`,
                employeeId,
                employeeName: emp?.name ?? employeeId,
                department: emp?.employment?.department ?? '',
                date: today,
                checkIn: time,
                checkOut: '-',
                workingHours: 'Working...',
                lateBy: day.lateBy,
                overtime: '-',
                status: day.status,
                punchSource: source,
            };
            if (record) Object.assign(record, fresh);
            else list.unshift((record = fresh));
        } else {
            if (!record || !record.checkIn || record.checkIn === '-') throw new Error('Punch in first.');
            if (record.checkOut && record.checkOut !== '-') throw new Error(`You already punched out at ${record.checkOut}.`);
            const day = evaluateDay(record.checkIn, time, settings);
            record.checkOut = time;
            record.workingHours = day.workingHours;
            record.overtime = day.overtime;
        }
        storage.setAttendance([...list]);
        return later({ ...record }, 100);
    },

    getCorrections: async () => later(storage.getCorrections()),

    submitCorrection: async (req) => {
        if (!req.employeeId) throw new Error('Your HR record is not set up.');
        if (!req.date) throw new Error('Choose the date to correct.');
        if (req.date > todayIso()) throw new Error('A correction can only be asked for a past or today\'s date.');
        const inAt = parseClock(req.requestedCheckIn);
        const outAt = parseClock(req.requestedCheckOut);
        if (inAt === null || outAt === null) throw new Error('Enter the corrected times like 09:15 AM.');
        if (outAt <= inAt) throw new Error('Punch out must be after punch in.');
        if (!req.reason?.trim()) throw new Error('Give the reason for the correction.');
        const list = storage.getCorrections();
        if (list.some((c) => c.employeeId === req.employeeId && c.date === req.date && c.status === 'Pending')) {
            throw new Error('A correction for this date is already waiting for approval.');
        }
        const record = storage.getAttendance().find((a) => a.employeeId === req.employeeId && a.date === req.date);
        const newReq = {
            ...req,
            reason: req.reason.trim(),
            currentCheckIn: record?.checkIn || '-',
            currentCheckOut: record?.checkOut || '-',
            id: `cor-${Date.now()}`,
            appliedDate: todayIso(),
            status: 'Pending',
        };
        storage.setCorrections([newReq, ...list]);
        return later(newReq, 100);
    },

    /* Approving writes the corrected times into that day's attendance. Nobody reviews their own request. */
    reviewCorrection: async (id, status, reviewerName, comment, reviewerEmployeeId) => {
        const list = storage.getCorrections();
        const item = list.find((c) => c.id === id);
        if (!item) throw new Error('Correction request not found.');
        if (item.status !== 'Pending') throw new Error(`This request is already ${item.status.toLowerCase()}.`);
        if (reviewerEmployeeId && reviewerEmployeeId === item.employeeId) throw new Error('You cannot approve your own correction request.');
        item.status = status;
        item.reviewedBy = reviewerName;
        item.reviewComment = comment;
        item.reviewedAt = new Date().toISOString();
        storage.setCorrections([...list]);

        if (status === 'Approved') {
            const attendance = storage.getAttendance();
            const day = evaluateDay(item.requestedCheckIn, item.requestedCheckOut, storage.getAttendanceSettings());
            const fields = {
                checkIn: item.requestedCheckIn,
                checkOut: item.requestedCheckOut,
                workingHours: day.workingHours,
                lateBy: day.lateBy,
                overtime: day.overtime,
                status: day.status,
                punchSource: 'Correction approved',
            };
            const record = attendance.find((a) => a.employeeId === item.employeeId && a.date === item.date);
            if (record) Object.assign(record, fields);
            else {
                attendance.unshift({
                    id: `att-c-${Date.now()}`,
                    employeeId: item.employeeId,
                    employeeName: item.employeeName,
                    department: item.department,
                    date: item.date,
                    ...fields,
                });
            }
            storage.setAttendance([...attendance]);
        }
        return later(true, 100);
    },
};
