import { mobileStorage } from '../storage';
import { EmployeeExitRequest } from '../types';

export class ExitService {
  async getExits(): Promise<EmployeeExitRequest[]> {
    return mobileStorage.getExits();
  }

  async getExitByEmployee(employeeId: string): Promise<EmployeeExitRequest | undefined> {
    const list = await mobileStorage.getExits();
    return list.find((e) => e.employeeId === employeeId);
  }

  async initiateExit(data: Omit<EmployeeExitRequest, 'id' | 'clearances' | 'relievingLetterIssued'>): Promise<EmployeeExitRequest> {
    const list = await mobileStorage.getExits();
    const newExit: EmployeeExitRequest = {
      ...data,
      id: `exit-${Date.now()}`,
      relievingLetterIssued: false,
      clearances: [
        { id: `c-${Date.now()}-1`, department: 'IT', reviewerName: 'Aman Jain (Systems Admin)', status: 'Pending', checklistNotes: 'Hardware, SIM, and system account de-provisioning' },
        { id: `c-${Date.now()}-2`, department: 'Admin & Assets', reviewerName: 'Dr. Sunita Meena', status: 'Pending', checklistNotes: 'ID badge, camp gear, safety helmet' },
        { id: `c-${Date.now()}-3`, department: 'Finance & Accounts', reviewerName: 'Kritika Gupta', status: 'Pending', checklistNotes: 'Imprest bills and travel advance settlement' },
        { id: `c-${Date.now()}-4`, department: 'HR & Legal', reviewerName: 'Kritika Gupta', status: 'Pending', checklistNotes: 'Exit interview and NDA non-disclosure signoff' },
      ],
    };
    list.unshift(newExit);
    await mobileStorage.setExits(list);
    return newExit;
  }

  async updateClearance(
    exitId: string,
    department: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    notes: string
  ): Promise<EmployeeExitRequest> {
    const list = await mobileStorage.getExits();
    const exitIndex = list.findIndex((e) => e.id === exitId);
    if (exitIndex === -1) {
      throw new Error('Exit request not found.');
    }

    const exit = { ...list[exitIndex] };
    exit.clearances = exit.clearances.map((c) =>
      c.department === department
        ? {
            ...c,
            status,
            checklistNotes: notes,
            clearanceDate: new Date().toISOString().split('T')[0],
          }
        : c
    );

    const allApproved = exit.clearances.every((c) => c.status === 'Approved');
    if (allApproved && exit.status === 'In Clearance') {
      exit.status = 'FnF Pending';
    }

    list[exitIndex] = exit;
    await mobileStorage.setExits(list);
    return exit;
  }

  async finalizeFnF(exitId: string, bankReference?: string): Promise<EmployeeExitRequest> {
    const list = await mobileStorage.getExits();
    const exitIndex = list.findIndex((e) => e.id === exitId);
    if (exitIndex === -1) {
      throw new Error('Exit request not found.');
    }

    const exit = { ...list[exitIndex] };
    if (exit.fnf) {
      exit.fnf = {
        ...exit.fnf,
        paymentStatus: 'Processed',
        settlementDate: new Date().toISOString().split('T')[0],
        bankReferenceNumber: bankReference || `BGS-NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
      };
    }
    exit.status = 'Settled & Relieved';
    exit.relievingLetterIssued = true;

        try {
      const employees = await mobileStorage.getEmployees();
      const emp = employees.find((e) => e.employeeId === exit.employeeId);
      if (emp) {
        emp.employment.status = 'Resigned';
        await mobileStorage.setEmployees(employees);
      }
    } catch (e) {
      console.error('Error updating employee status on exit:', e);
    }

    list[exitIndex] = exit;
    await mobileStorage.setExits(list);
    return exit;
  }
}

export const exitService = new ExitService();
