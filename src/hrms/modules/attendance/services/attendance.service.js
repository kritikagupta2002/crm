import { storage } from '@/core/storage/storage';
export const attendanceService = {
    getAttendance: async () => {
        const list = storage.getAttendance();
        const employees = storage.getEmployees();
        const today = new Date().toLocaleDateString('en-CA');
        let updated = false;
        for (const emp of employees) {
            const exists = list.some((a) => a.employeeId === emp.employeeId);
            if (!exists) {
                list.push({
                    id: `att-${emp.employeeId}`,
                    employeeId: emp.employeeId,
                    employeeName: emp.name,
                    department: emp.employment.department,
                    date: today,
                    checkIn: '09:00 AM',
                    checkOut: '06:00 PM',
                    workingHours: '9h 00m',
                    lateBy: '-',
                    overtime: '-',
                    status: 'Present',
                    punchSource: 'Biometric - Jaipur HQ',
                });
                updated = true;
            }
        }
        if (updated) {
            storage.setAttendance(list);
        }
        return new Promise(resolve => setTimeout(() => resolve(list), 80));
    },
    recordPunch: async (employeeId, punchType, location) => {
        const list = storage.getAttendance();
        const today = new Date().toLocaleDateString('en-CA');
        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        let record = list.find((a) => a.employeeId === employeeId && a.date === today);
        if (!record) {
            // Whoever punched in (the register used to put every punch under one fixed name).
            const emp = storage.getEmployees().find((e) => e.employeeId === employeeId);
            record = {
                id: `att-${Date.now()}`,
                employeeId,
                employeeName: emp?.name ?? employeeId,
                department: emp?.employment?.department ?? '',
                date: today,
                checkIn: nowTime,
                checkOut: '-',
                workingHours: 'Just checked in',
                lateBy: '-',
                overtime: '-',
                status: 'Present',
                punchSource: (location.includes('Bhilwara') ? 'Biometric - Bhilwara Mine' : 'Biometric - Jaipur HQ'),
            };
            list.unshift(record);
        }
        else {
            if (punchType === 'checkOut') {
                record.checkOut = nowTime;
                record.workingHours = '8h 30m';
            }
        }
        storage.setAttendance([...list]);
        return new Promise(resolve => setTimeout(() => resolve(record), 100));
    },
    getCorrections: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getCorrections()), 80));
    },
    submitCorrection: async (req) => {
        const list = storage.getCorrections();
        const newReq = {
            ...req,
            id: `cor-${Date.now()}`,
            appliedDate: new Date().toLocaleDateString('en-CA'),
            status: 'Pending',
        };
        storage.setCorrections([newReq, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newReq), 100));
    },
    reviewCorrection: async (id, status, reviewerName, comment) => {
        const list = storage.getCorrections();
        const item = list.find((c) => c.id === id);
        if (item) {
            item.status = status;
            item.reviewedBy = reviewerName;
            item.reviewComment = comment;
            storage.setCorrections([...list]);
        }
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
    }
};
