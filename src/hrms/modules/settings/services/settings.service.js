import { storage } from '@/core/storage/storage';
export const settingsService = {
    getCompanySettings: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getCompanySettings()), 50));
    },
    updateCompanySettings: async (val) => {
        const current = storage.getCompanySettings();
        const updated = { ...current, ...val };
        storage.setCompanySettings(updated);
        return new Promise(resolve => setTimeout(() => resolve(updated), 80));
    },
    getAttendanceSettings: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getAttendanceSettings()), 50));
    },
    updateAttendanceSettings: async (val) => {
        const current = storage.getAttendanceSettings();
        const updated = { ...current, ...val };
        storage.setAttendanceSettings(updated);
        return new Promise(resolve => setTimeout(() => resolve(updated), 80));
    },
    getLeaveSettings: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getLeaveSettings()), 50));
    },
    updateLeaveSettings: async (val) => {
        const current = storage.getLeaveSettings();
        const updated = { ...current, ...val };
        storage.setLeaveSettings(updated);
        return new Promise(resolve => setTimeout(() => resolve(updated), 80));
    },
    getPayrollSettings: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getPayrollSettings()), 50));
    },
    updatePayrollSettings: async (val) => {
        const current = storage.getPayrollSettings();
        const updated = { ...current, ...val };
        storage.setPayrollSettings(updated);
        return new Promise(resolve => setTimeout(() => resolve(updated), 80));
    },
};
