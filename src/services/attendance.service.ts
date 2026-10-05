import { mobileStorage } from '../storage';
import { AttendanceRecord, AttendanceCorrection, AttendanceStatus } from '../types';
import { calculateDurationFromTimes } from '../constants/attendance';

export class AttendanceService {
  async getTodayRecord(employeeId: string): Promise<AttendanceRecord | null> {
    const records = await mobileStorage.getAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    return records.find((r) => r.employeeId === employeeId && r.date === todayStr) || null;
  }

  async getAllRecords(employeeId?: string): Promise<AttendanceRecord[]> {
    const records = await mobileStorage.getAttendance();
    if (employeeId) {
      return records.filter((r) => r.employeeId === employeeId);
    }
    return records;
  }

  async punchIn(
    employeeId: string,
    employeeName: string,
    department: string = 'Geology & Mineral Exploration',
    workLocation: string = 'Jaipur Corporate HQ',
    punchSource?: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<AttendanceRecord> {
    const records = await mobileStorage.getAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let existing = records.find((r) => r.employeeId === employeeId && r.date === todayStr);

    if (existing && existing.punchIn && existing.punchIn !== '-' && existing.punchOut === '-') {
      throw new Error(`Already checked in today at ${existing.punchIn}. You can check out when your shift finishes.`);
    }

    const isField =
      workLocation.toLowerCase().includes('field') ||
      workLocation.toLowerCase().includes('rig') ||
      workLocation.toLowerCase().includes('bhilwara') ||
      workLocation.toLowerCase().includes('camp') ||
      workLocation.toLowerCase().includes('site');

    const source =
      punchSource ||
      (isField
        ? 'Mobile Punch (Field GPS)'
        : 'Biometric - Jaipur HQ');

    const late = !isField && nowMins > 570; // after 09:30 AM
    let status: AttendanceStatus = 'Present';
    if (isField) {
      status = 'Field Duty';
    } else if (late) {
      status = 'Late';
    }

    if (existing) {
      existing.punchIn = nowTimeStr;
      existing.checkIn = nowTimeStr;
      existing.workLocation = workLocation;
      existing.punchSource = source;
      existing.coordinates = coords;
      existing.status = status;
      existing.workingHours = 'Working...';
      existing.lateBy = late ? `${nowMins - 540}m` : '-';
    } else {
      existing = {
        id: 'att-' + Date.now(),
        employeeId,
        employeeName,
        department,
        date: todayStr,
        status,
        punchIn: nowTimeStr,
        punchOut: '-',
        checkIn: nowTimeStr,
        checkOut: '-',
        durationHours: 0,
        workingHours: 'Working...',
        lateBy: late ? `${nowMins - 540}m` : '-',
        overtime: '-',
        punchSource: source,
        workLocation,
        coordinates: coords,
      };
      records.unshift(existing);
    }

    await mobileStorage.setAttendance(records);
    return existing;
  }

  async punchOut(employeeId: string): Promise<AttendanceRecord> {
    const records = await mobileStorage.getAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const existing = records.find((r) => r.employeeId === employeeId && r.date === todayStr);
    if (!existing || !existing.punchIn || existing.punchIn === '-') {
      throw new Error('No active punch-in record found for today. Please punch in first.');
    }

    if (existing.punchOut && existing.punchOut !== '-') {
      throw new Error(`Already checked out today at ${existing.punchOut}.`);
    }

    existing.punchOut = nowTimeStr;
    existing.checkOut = nowTimeStr;

    const calc = calculateDurationFromTimes(existing.punchIn, nowTimeStr);
    existing.durationHours = calc.durationHours;
    existing.workingHours = calc.workingHours;
    existing.overtime = calc.overtime;

    const isField =
      existing.workLocation.toLowerCase().includes('field') ||
      existing.workLocation.toLowerCase().includes('bhilwara') ||
      existing.workLocation.toLowerCase().includes('site') ||
      existing.workLocation.toLowerCase().includes('camp');

    if (existing.durationHours >= 8.0) {
      existing.status = isField ? 'Field Duty' : 'Present';
    } else if (existing.durationHours >= 4.0) {
      existing.status = 'Half-Day';
    } else {
      existing.status = 'Absent';
    }

    await mobileStorage.setAttendance(records);
    return existing;
  }

  async submitCorrection(
    employeeId: string,
    employeeName: string,
    department: string,
    date: string,
    currentCheckIn: string,
    currentCheckOut: string,
    requestedCheckIn: string,
    requestedCheckOut: string,
    reason: string
  ): Promise<AttendanceCorrection> {
    if (!date || !requestedCheckIn || !requestedCheckOut || !reason) {
      throw new Error('Please fill all required correction fields.');
    }
    if (reason.trim().length < 10) {
      throw new Error('Please provide at least 10 characters detailing the reason/justification.');
    }

    const corrections = await mobileStorage.getCorrections();
    const todayStr = new Date().toISOString().split('T')[0];

    const newCorr: AttendanceCorrection = {
      id: 'cor-' + Date.now(),
      employeeId,
      employeeName,
      department,
      date,
      currentCheckIn: currentCheckIn || '-',
      currentCheckOut: currentCheckOut || '-',
      requestedIn: requestedCheckIn,
      requestedOut: requestedCheckOut,
      requestedCheckIn,
      requestedCheckOut,
      reason: reason.trim(),
      status: 'Pending',
      appliedAt: todayStr,
      appliedDate: todayStr,
    };

    corrections.unshift(newCorr);
    await mobileStorage.setCorrections(corrections);
    return newCorr;
  }

  async reviewCorrection(
    id: string,
    status: 'Approved' | 'Rejected',
    reviewerName: string,
    reviewComment: string
  ): Promise<void> {
    const corrections = await mobileStorage.getCorrections();
    const corr = corrections.find((c) => c.id === id);
    if (!corr) throw new Error('Correction record not found.');

    corr.status = status;
    corr.reviewedBy = reviewerName;
    corr.reviewComment = reviewComment;
    corr.hrRemarks = reviewComment;
    await mobileStorage.setCorrections(corrections);

    if (status === 'Approved') {
      const records = await mobileStorage.getAttendance();
      let att = records.find((r) => r.employeeId === corr.employeeId && r.date === corr.date);
      const reqIn = corr.requestedCheckIn || corr.requestedIn || '09:00 AM';
      const reqOut = corr.requestedCheckOut || corr.requestedOut || '06:00 PM';
      const calc = calculateDurationFromTimes(reqIn, reqOut);

      if (att) {
        att.punchIn = reqIn;
        att.punchOut = reqOut;
        att.checkIn = reqIn;
        att.checkOut = reqOut;
        att.status = 'Present';
        att.durationHours = calc.durationHours > 0 ? calc.durationHours : 8.0;
        att.workingHours = calc.workingHours !== '-' ? calc.workingHours : '8h 00m';
        att.lateBy = '-';
      } else {
        records.unshift({
          id: 'att-' + Date.now(),
          employeeId: corr.employeeId,
          employeeName: corr.employeeName,
          department: corr.department || 'Operations',
          date: corr.date,
          status: 'Present',
          punchIn: reqIn,
          punchOut: reqOut,
          checkIn: reqIn,
          checkOut: reqOut,
          durationHours: calc.durationHours > 0 ? calc.durationHours : 8.0,
          workingHours: calc.workingHours !== '-' ? calc.workingHours : '8h 00m',
          lateBy: '-',
          overtime: '-',
          workLocation: 'Regularized via HR Sign-off',
          punchSource: 'Biometric Regularization',
        });
      }
      await mobileStorage.setAttendance(records);
    }
  }

  async getCorrections(employeeId?: string): Promise<AttendanceCorrection[]> {
    const corrections = await mobileStorage.getCorrections();
    if (employeeId) {
      return corrections.filter((c) => c.employeeId === employeeId);
    }
    return corrections;
  }
}

export const attendanceService = new AttendanceService();
