import { storage } from '@/core/storage/storage';
import { offDaysFromLabel } from '@/modules/leave/utils/workingDays';

/* A person's weekly off days, from their shift assignment (Saturday & Sunday when none is set). */
export function weeklyOffFor(employeeId) {
    const assignment = storage.getShiftAssignments().find((a) => a.employeeId === employeeId && a.status !== 'Inactive');
    if (assignment?.weeklyOff) return offDaysFromLabel(assignment.weeklyOff);
    const shift = storage.getShifts().find((s) => s.id === assignment?.shiftId);
    return offDaysFromLabel(shift?.weeklyOff);
}
