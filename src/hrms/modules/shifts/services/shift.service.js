import { storage } from '@/core/storage/storage';
export const shiftService = {
    getShifts: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getShifts()), 80));
    },
    createShift: async (data) => {
        const list = storage.getShifts();
        const newShift = { ...data, id: `sh-${Date.now()}` };
        storage.setShifts([newShift, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newShift), 100));
    },
    getAssignments: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getShiftAssignments()), 80));
    },
    assignShift: async (assignment) => {
        const list = storage.getShiftAssignments();
        const newAssignment = { ...assignment, id: `sa-${Date.now()}` };
        storage.setShiftAssignments([newAssignment, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newAssignment), 100));
    }
};
