import { mobileStorage } from '../storage';
import { Shift, ShiftAssignment, RosterEntry } from '../types';

export class ShiftService {

  async getShifts(): Promise<Shift[]> {
    const [shifts, assignments] = await Promise.all([
      mobileStorage.getShifts(),
      mobileStorage.getShiftAssignments(),
    ]);

    return shifts.map((shift) => {
      const liveAssigned = assignments.filter(
        (a) => a.shiftId === shift.id && a.status === 'Active'
      ).length;

      return {
        ...shift,
        assignedEmployeesCount: liveAssigned > 0 ? liveAssigned : (shift.assignedEmployeesCount || 0),
      };
    });
  }

  async getShiftById(id: string): Promise<Shift | null> {
    const shifts = await this.getShifts();
    return shifts.find((s) => s.id === id) || null;
  }

  async createShift(data: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    workHours?: number;
    breakDuration?: string;
    gracePeriod?: string;
    weeklyOff?: string;
    location?: string;
    status?: 'Active' | 'Inactive';
    description?: string;
  }): Promise<Shift> {
    const trimmedName = data.name.trim();
    const trimmedCode = data.code.trim().toUpperCase();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Shift Name is required and must be at least 2 characters.');
    }
    if (!trimmedCode || trimmedCode.length < 2 || trimmedCode.length > 15) {
      throw new Error('Shift Code is required (2 to 15 characters).');
    }
    if (!data.startTime?.trim() || !data.endTime?.trim()) {
      throw new Error('Start Time and End Time are required.');
    }

    const shifts = await mobileStorage.getShifts();

    const duplicateCode = shifts.find(
      (s) => s.code.toLowerCase() === trimmedCode.toLowerCase()
    );
    if (duplicateCode) {
      throw new Error(`Shift Code "${trimmedCode}" is already in use by "${duplicateCode.name}".`);
    }

    const duplicateName = shifts.find(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      throw new Error(`Shift Name "${trimmedName}" already exists.`);
    }

    const newShift: Shift = {
      id: `sh-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      startTime: data.startTime.trim(),
      endTime: data.endTime.trim(),
      workHours: data.workHours || 8.5,
      breakDuration: data.breakDuration?.trim() || '45 mins',
      gracePeriod: data.gracePeriod?.trim() || '15 mins',
      weeklyOff: data.weeklyOff?.trim() || 'Saturday & Sunday',
      location: data.location?.trim() || 'Jaipur Corporate HQ',
      status: data.status || 'Active',
      assignedEmployeesCount: 0,
      description: data.description?.trim() || '',
    };

    const updated = [newShift, ...shifts];
    await mobileStorage.setShifts(updated);
    return newShift;
  }

  async updateShift(
    id: string,
    data: Partial<Omit<Shift, 'id'>>
  ): Promise<Shift> {
    const shifts = await mobileStorage.getShifts();
    const index = shifts.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Shift with ID "${id}" was not found.`);
    }

    const existing = shifts[index];

    if (data.code && data.code.trim().toUpperCase() !== existing.code) {
      const codeCheck = data.code.trim().toUpperCase();
      const duplicate = shifts.find(
        (s) => s.id !== id && s.code.toLowerCase() === codeCheck.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Shift Code "${codeCheck}" is already used by "${duplicate.name}".`);
      }
    }

    if (data.name && data.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const nameCheck = data.name.trim();
      const duplicate = shifts.find(
        (s) => s.id !== id && s.name.toLowerCase() === nameCheck.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Shift Name "${nameCheck}" already exists.`);
      }
    }

    const updatedShift: Shift = {
      ...existing,
      ...data,
      code: data.code ? data.code.trim().toUpperCase() : existing.code,
      name: data.name ? data.name.trim() : existing.name,
      startTime: data.startTime ? data.startTime.trim() : existing.startTime,
      endTime: data.endTime ? data.endTime.trim() : existing.endTime,
    };

    shifts[index] = updatedShift;
    await mobileStorage.setShifts(shifts);

    if (data.name && data.name !== existing.name) {
      const assignments = await mobileStorage.getShiftAssignments();
      let assignmentsModified = false;
      const updatedAssignments = assignments.map((a) => {
        if (a.shiftId === id) {
          assignmentsModified = true;
          return { ...a, shiftName: updatedShift.name };
        }
        return a;
      });
      if (assignmentsModified) {
        await mobileStorage.setShiftAssignments(updatedAssignments);
      }

      const roster = await mobileStorage.getRoster();
      let rosterModified = false;
      const updatedRoster = roster.map((r) => {
        if (r.shiftId === id) {
          rosterModified = true;
          return { ...r, shiftName: updatedShift.name };
        }
        return r;
      });
      if (rosterModified) {
        await mobileStorage.setRoster(updatedRoster);
      }
    }

    return updatedShift;
  }

  async toggleShiftStatus(id: string): Promise<Shift> {
    const shift = await this.getShiftById(id);
    if (!shift) {
      throw new Error(`Shift with ID "${id}" was not found.`);
    }
    const nextStatus = shift.status === 'Active' ? 'Inactive' : 'Active';
    return this.updateShift(id, { status: nextStatus });
  }

  async deleteShift(id: string): Promise<void> {
    const shifts = await mobileStorage.getShifts();
    const shift = shifts.find((s) => s.id === id);
    if (!shift) {
      throw new Error(`Shift with ID "${id}" does not exist.`);
    }

    const assignments = await mobileStorage.getShiftAssignments();
    const activeAssignments = assignments.filter((a) => a.shiftId === id && a.status === 'Active');

    if (activeAssignments.length > 0) {
      throw new Error(
        `Cannot delete shift "${shift.name}" (${shift.code}). It is currently assigned to ${activeAssignments.length} staff member(s). Reassign them first or deactivate this shift.`
      );
    }

    const roster = await mobileStorage.getRoster();
    const futureRosterEntries = roster.filter(
      (r) => r.shiftId === id && (r.status === 'Scheduled' || r.status === 'Active Today')
    );
    if (futureRosterEntries.length > 0) {
      throw new Error(
        `Cannot delete shift "${shift.name}". It is referenced in ${futureRosterEntries.length} upcoming roster schedule(s). Soft deactivate instead.`
      );
    }

    const filtered = shifts.filter((s) => s.id !== id);
    await mobileStorage.setShifts(filtered);
  }

  async getAssignments(): Promise<ShiftAssignment[]> {
    return mobileStorage.getShiftAssignments();
  }

  async assignShift(data: {
    employeeId: string;
    employeeName: string;
    department: string;
    shiftId: string;
    shiftName: string;
    effectiveFrom: string;
    weeklyOff: string;
    status?: 'Active' | 'Inactive';
  }): Promise<ShiftAssignment> {
    if (!data.employeeId || !data.shiftId) {
      throw new Error('Employee and Shift must both be selected.');
    }

    const [shifts, employees, existingAssignments] = await Promise.all([
      mobileStorage.getShifts(),
      mobileStorage.getEmployees(),
      mobileStorage.getShiftAssignments(),
    ]);

    const shift = shifts.find((s) => s.id === data.shiftId);
    if (!shift) {
      throw new Error(`Selected Shift was not found.`);
    }

    const emp = employees.find((e) => e.employeeId === data.employeeId);
    const employeeName = emp ? emp.name : data.employeeName;
    const department = emp?.employment?.department || data.department;

    const existingIndex = existingAssignments.findIndex(
      (a) => a.employeeId === data.employeeId
    );

    let updatedAssignment: ShiftAssignment;
    let newAssignmentsList: ShiftAssignment[];

    if (existingIndex !== -1) {
      updatedAssignment = {
        ...existingAssignments[existingIndex],
        shiftId: shift.id,
        shiftName: shift.name,
        department,
        employeeName,
        effectiveFrom: data.effectiveFrom || '2026-10-01',
        weeklyOff: data.weeklyOff || 'Sunday',
        status: data.status || 'Active',
      };
      newAssignmentsList = [...existingAssignments];
      newAssignmentsList[existingIndex] = updatedAssignment;
    } else {
      updatedAssignment = {
        id: `sa-${Date.now()}`,
        employeeId: data.employeeId,
        employeeName,
        department,
        shiftId: shift.id,
        shiftName: shift.name,
        effectiveFrom: data.effectiveFrom || '2026-10-01',
        weeklyOff: data.weeklyOff || 'Sunday',
        status: data.status || 'Active',
      };
      newAssignmentsList = [updatedAssignment, ...existingAssignments];
    }

    await mobileStorage.setShiftAssignments(newAssignmentsList);

    await this.syncEmployeeRosterWithAssignment(updatedAssignment);

    return updatedAssignment;
  }

  private async syncEmployeeRosterWithAssignment(
    assignment: ShiftAssignment
  ): Promise<void> {
    const roster = await mobileStorage.getRoster();
    const todayStr = '2026-10-03';

    const updated = roster.map((entry) => {
      if (
        entry.employeeId === assignment.employeeId &&
        entry.date >= todayStr &&
        entry.status !== 'On Leave'
      ) {
        const dateObj = new Date(entry.date);
        const dayOfWeek = dateObj.getDay();

        let isWeeklyOff = false;
        const off = assignment.weeklyOff || 'Sunday';
        if (off === 'Saturday & Sunday') {
          isWeeklyOff = dayOfWeek === 0 || dayOfWeek === 6;
        } else if (off === 'Sunday') {
          isWeeklyOff = dayOfWeek === 0;
        } else if (off.includes('Rotational')) {
          isWeeklyOff = dayOfWeek === 3;
        }

        const newStatus: RosterEntry['status'] = isWeeklyOff
          ? 'Weekly Off'
          : entry.date === todayStr
          ? 'Active Today'
          : 'Scheduled';

        return {
          ...entry,
          shiftId: assignment.shiftId,
          shiftName: assignment.shiftName,
          status: newStatus,
          notes: isWeeklyOff ? 'Designated weekly rest day' : `${assignment.shiftName} operational roster`,
        };
      }
      return entry;
    });

    await mobileStorage.setRoster(updated);
  }

  async getRoster(month?: string): Promise<RosterEntry[]> {
    const allRoster = await mobileStorage.getRoster();
    if (!month) {
      return allRoster;
    }
    return allRoster.filter((r) => r.date.startsWith(month));
  }

  async getRosterByEmployee(
    employeeId: string,
    month?: string
  ): Promise<RosterEntry[]> {
    const roster = await this.getRoster(month);
    return roster.filter((r) => r.employeeId === employeeId);
  }

  async saveRosterEntry(entry: {
    id?: string;
    employeeId: string;
    employeeName: string;
    department: string;
    shiftId: string;
    shiftName: string;
    date: string;
    status: RosterEntry['status'];
    notes?: string;
  }): Promise<RosterEntry> {
    if (!entry.employeeId || !entry.shiftId || !entry.date) {
      throw new Error('Employee, Shift, and Date are required for a roster record.');
    }

    const roster = await mobileStorage.getRoster();
    const existingIndex = roster.findIndex(
      (r) =>
        (entry.id && r.id === entry.id) ||
        (r.employeeId === entry.employeeId && r.date === entry.date)
    );

    let savedEntry: RosterEntry;
    let updatedRoster: RosterEntry[];

    if (existingIndex !== -1) {
      savedEntry = {
        ...roster[existingIndex],
        ...entry,
        id: roster[existingIndex].id,
      };
      updatedRoster = [...roster];
      updatedRoster[existingIndex] = savedEntry;
    } else {
      savedEntry = {
        ...entry,
        id: entry.id || `rst-${entry.date}-${entry.employeeId}`,
      };
      updatedRoster = [savedEntry, ...roster];
    }

    await mobileStorage.setRoster(updatedRoster);
    return savedEntry;
  }
}

export const shiftService = new ShiftService();
