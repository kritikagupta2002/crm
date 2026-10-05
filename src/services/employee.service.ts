import { mobileStorage } from '../storage';
import { Employee } from '../types';
import { DEFAULT_LEAVE_TYPES } from '../constants';
import { isValidIndianMobile } from '../utils';

export class EmployeeService {
  async getEmployees(): Promise<Employee[]> {
    return mobileStorage.getEmployees();
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const list = await mobileStorage.getEmployees();
    return list.find((e) => e.id === id || e.employeeId === id);
  }

  async createEmployee(data: {
    employeeId: string;
    name: string;
    role?: 'admin' | 'hr' | 'manager' | 'employee' | string;
    avatarUrl?: string;
    personal?: {
      firstName?: string;
      lastName?: string;
      dob?: string;
      gender?: 'Male' | 'Female' | 'Other';
      bloodGroup?: string;
      maritalStatus?: string;
      nationality?: string;
    };
    contact: {
      workEmail: string;
      personalEmail?: string;
      phone: string;
      currentAddress?: string;
      permanentAddress?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    employment: {
      department: string;
      designation: string;
      designationCode?: string;
      joiningDate: string;
      employmentType?: string;
      managerId?: string;
      managerName?: string;
      workLocation?: string;
      status?: 'Active' | 'On Leave' | 'On Notice' | 'Notice Period' | 'Probation' | 'Terminated' | 'Resigned' | 'Retired';
      project?: string;
    };
    emergency?: {
      name: string;
      relationship: string;
      phone: string;
    };
    bank?: {
      accountHolderName?: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      panNumber?: string;
      uanNumber?: string;
    };
    baseSalary?: number;
  }): Promise<Employee> {
    const employees = await mobileStorage.getEmployees();

    const trimmedName = data.name?.trim();
    if (!trimmedName || trimmedName.length < 3) {
      throw new Error('Full Name is required and must be at least 3 characters.');
    }

    const cleanEmpId = data.employeeId?.trim().toUpperCase();
    if (!cleanEmpId || cleanEmpId.length < 3) {
      throw new Error('Employee ID is required and must be at least 3 characters.');
    }
    const duplicateId = employees.find(
      (e) => e.employeeId.toUpperCase() === cleanEmpId
    );
    if (duplicateId) {
      throw new Error(`Employee ID "${cleanEmpId}" already exists. Please assign a unique employee ID.`);
    }

    const cleanEmail = data.contact.workEmail?.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Valid corporate work email address is required.');
    }
    const duplicateEmail = employees.find(
      (e) => (e.email || e.contact?.workEmail)?.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      throw new Error(`Email address "${cleanEmail}" is already registered with ${duplicateEmail.name}.`);
    }

    const cleanPhone = data.contact.phone?.trim();
    if (!cleanPhone || !isValidIndianMobile(cleanPhone)) {
      throw new Error('Mobile Phone must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.');
    }

        if (data.personal?.dob) {
      const birthDate = new Date(data.personal.dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new Error(`Statutory Age Limit: Candidate must be at least 18 years old (currently ${age} yrs).`);
        }
        if (age > 65) {
          throw new Error(`Statutory Age Limit: Candidate exceeds maximum retirement age (65 yrs, currently ${age} yrs).`);
        }
      }
    }

        if (!data.employment.department?.trim()) {
      throw new Error('Department assignment is required from Organization Master.');
    }
    if (!data.employment.designation?.trim()) {
      throw new Error('Designation assignment is required from Organization Master.');
    }

    const newId = 'emp-' + Date.now();
    const nameParts = trimmedName.split(' ');
    const firstName = data.personal?.firstName || nameParts[0] || trimmedName;
    const lastName = data.personal?.lastName || nameParts.slice(1).join(' ') || '';

    const newEmp: Employee = {
      id: newId,
      employeeId: cleanEmpId,
      name: trimmedName,
      email: cleanEmail,
      phone: cleanPhone,
      avatarUrl: data.avatarUrl || '',
      role: data.role || 'employee',
      personal: {
        firstName,
        lastName,
        dob: data.personal?.dob || '1995-06-15',
        gender: data.personal?.gender || 'Male',
        bloodGroup: data.personal?.bloodGroup || 'B+',
        maritalStatus: data.personal?.maritalStatus || 'Single',
        nationality: data.personal?.nationality || 'Indian',
      },
      contact: {
        workEmail: cleanEmail,
        personalEmail: data.contact.personalEmail?.trim() || '',
        phone: cleanPhone,
        currentAddress: data.contact.currentAddress || '',
        permanentAddress: data.contact.permanentAddress || data.contact.currentAddress || '',
        city: data.contact.city || 'Jaipur',
        state: data.contact.state || 'Rajasthan',
        pincode: data.contact.pincode || '302017',
      },
      employment: {
        employeeId: cleanEmpId,
        department: data.employment.department.trim(),
        designation: data.employment.designation.trim(),
        designationCode: data.employment.designationCode || '',
        joiningDate: data.employment.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: data.employment.employmentType || 'Full-Time',
        managerId: data.employment.managerId || 'BGS-001',
        managerName: data.employment.managerName || 'Dr. Amit Kumar Bansal',
        workLocation: data.employment.workLocation || 'Jaipur Corporate HQ',
        status: data.employment.status || 'Active',
        project: data.employment.project || 'General Geological Operations',
      },
      kyc: {
        panNumber: data.bank?.panNumber?.trim().toUpperCase() || 'ABCDE1234F',
        aadhaarNumber: 'XXXX-XXXX-1122',
        uanNumber: data.bank?.uanNumber?.trim() || '',
        bankAccount: data.bank?.accountNumber?.trim() || '',
        bankName: data.bank?.bankName?.trim() || 'HDFC Bank Ltd.',
        accountHolderName: data.bank?.accountHolderName?.trim() || trimmedName,
        ifscCode: data.bank?.ifscCode?.trim().toUpperCase() || 'HDFC0001234',
        status: 'Verified',
      },
      emergency: data.emergency ? {
        name: data.emergency.name.trim(),
        relationship: data.emergency.relationship.trim(),
        phone: data.emergency.phone.trim(),
      } : {
        name: 'Family Contact',
        relationship: 'Family',
        phone: cleanPhone,
      },
      bank: {
        accountHolderName: data.bank?.accountHolderName?.trim() || trimmedName,
        bankName: data.bank?.bankName?.trim() || 'HDFC Bank',
        accountNumber: data.bank?.accountNumber?.trim() || '',
        ifscCode: data.bank?.ifscCode?.trim().toUpperCase() || 'HDFC0001234',
        panNumber: data.bank?.panNumber?.trim().toUpperCase() || 'ABCDE1234F',
        uanNumber: data.bank?.uanNumber?.trim() || '',
      },
      baseSalary: data.baseSalary || 55000,
      documents: [],
    };

    employees.unshift(newEmp);
    await mobileStorage.setEmployees(employees);

    try {
      const balances = await mobileStorage.getLeaveBalances();
      if (!balances[cleanEmpId]) {
        balances[cleanEmpId] = DEFAULT_LEAVE_TYPES.map((b) => ({
          ...b,
          employeeId: cleanEmpId,
          employeeName: trimmedName,
        }));
        await mobileStorage.setLeaveBalances(balances);
      }
    } catch (e) {
      console.error('Error initializing leave balances for new employee:', e);
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceList = await mobileStorage.getAttendance();
      const exists = attendanceList.some((a) => a.employeeId === cleanEmpId && a.date === today);
      if (!exists) {
        attendanceList.unshift({
          id: `att-${Date.now()}`,
          employeeId: cleanEmpId,
          employeeName: trimmedName,
          department: newEmp.employment.department,
          date: today,
          status: 'Present',
          punchIn: '09:00 AM',
          punchOut: '-',
          durationHours: 0,
          workLocation: newEmp.employment.workLocation,
          punchSource: 'Biometric - Jaipur HQ',
        });
        await mobileStorage.setAttendance(attendanceList);
      }
    } catch (e) {
      console.error('Error initializing attendance for new employee:', e);
    }

    try {
      const salaries = await mobileStorage.getSalaryStructures();
      const existingSal = salaries.some((s) => s.employeeId === cleanEmpId);
      if (!existingSal) {
        const gross = Number(data.baseSalary) || 55000;
        const basic = Math.round(gross * 0.5);
        const hra = Math.round(gross * 0.25);
        const spl = Math.max(0, gross - basic - hra);
        const epf = Math.round(Math.min(basic, 15000) * 0.12);
        const pt = 200;
        const net = gross - epf - pt;

        salaries.unshift({
          id: 'sal-' + newId,
          employeeId: cleanEmpId,
          employeeName: trimmedName,
          basic,
          hra,
          specialAllowance: spl,
          conveyance: 0,
          monthlyGross: gross,
          epf,
          esi: 0,
          pt,
          monthlyNet: net,
        });
        await mobileStorage.setSalaryStructures(salaries);
      }
    } catch (e) {
      console.error('Error initializing salary structure for new employee:', e);
    }

    try {
      const depts = await mobileStorage.getDepartments();
      const targetDept = depts.find(
        (d) => d.name.toLowerCase() === newEmp.employment.department.toLowerCase()
      );
      if (targetDept) {
        targetDept.staffCount = (targetDept.staffCount || 0) + 1;
        targetDept.employeeCount = targetDept.staffCount;
        await mobileStorage.setDepartments(depts);
      }
    } catch (e) {
      console.error('Error updating department staff count:', e);
    }

        try {
      const desigs = await mobileStorage.getDesignations();
      const targetDesig = desigs.find(
        (d) => d.title.toLowerCase() === newEmp.employment.designation.toLowerCase()
      );
      if (targetDesig) {
        targetDesig.assignedStaffCount = (targetDesig.assignedStaffCount || 0) + 1;
        targetDesig.employeeCount = targetDesig.assignedStaffCount;
        await mobileStorage.setDesignations(desigs);
      }
    } catch (e) {
      console.error('Error updating designation staff count:', e);
    }

    return newEmp;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const employees = await mobileStorage.getEmployees();
    const index = employees.findIndex((e) => e.id === id || e.employeeId === id);
    if (index === -1) {
      throw new Error('Employee record not found.');
    }

    const current = employees[index];

    if (updates.employeeId && updates.employeeId !== current.employeeId) {
      const cleanEmpId = updates.employeeId.trim().toUpperCase();
      const duplicateId = employees.find(
        (e) => e.id !== current.id && e.employeeId.toUpperCase() === cleanEmpId
      );
      if (duplicateId) {
        throw new Error(`Employee ID "${cleanEmpId}" is already assigned to ${duplicateId.name}.`);
      }
    }

    const newEmail = updates.email || updates.contact?.workEmail;
    if (newEmail && newEmail.toLowerCase() !== current.email.toLowerCase()) {
      const cleanEmail = newEmail.trim().toLowerCase();
      const duplicateEmail = employees.find(
        (e) => e.id !== current.id && (e.email || e.contact?.workEmail)?.toLowerCase() === cleanEmail
      );
      if (duplicateEmail) {
        throw new Error(`Email "${cleanEmail}" is already used by ${duplicateEmail.name}.`);
      }
    }

    const updatedEmployee: Employee = {
      ...current,
      ...updates,
      name: updates.name ? updates.name.trim() : current.name,
      email: newEmail ? newEmail.trim().toLowerCase() : current.email,
      phone: updates.phone ? updates.phone.trim() : (updates.contact?.phone || current.phone),
      personal: {
        ...(current.personal || { firstName: current.name, lastName: '', gender: 'Male' }),
        ...(updates.personal || {}),
      },
      contact: {
        ...(current.contact || { workEmail: current.email, phone: current.phone }),
        ...(updates.contact || {}),
      },
      employment: {
        ...current.employment,
        ...(updates.employment || {}),
      },
      kyc: {
        ...current.kyc,
        ...(updates.kyc || {}),
      },
      emergency: {
        ...(current.emergency || { name: 'Family', relationship: 'Family', phone: current.phone }),
        ...(updates.emergency || {}),
      },
    };

    employees[index] = updatedEmployee;
    await mobileStorage.setEmployees(employees);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    const employees = await mobileStorage.getEmployees();
    const target = employees.find((e) => e.id === id || e.employeeId === id);
    if (!target) throw new Error('Employee not found.');

    const updated = employees.filter((e) => e.id !== id && e.employeeId !== id);
    await mobileStorage.setEmployees(updated);

    try {
      const depts = await mobileStorage.getDepartments();
      const dept = depts.find((d) => d.name === target.employment?.department);
      if (dept && dept.staffCount > 0) {
        dept.staffCount--;
        dept.employeeCount = dept.staffCount;
        await mobileStorage.setDepartments(depts);
      }
    } catch (e) {
      console.error('Error decrementing dept count:', e);
    }

        try {
      const desigs = await mobileStorage.getDesignations();
      const desig = desigs.find((d) => d.title === target.employment?.designation);
      if (desig && desig.assignedStaffCount > 0) {
        desig.assignedStaffCount--;
        desig.employeeCount = desig.assignedStaffCount;
        await mobileStorage.setDesignations(desigs);
      }
    } catch (e) {
      console.error('Error decrementing desig count:', e);
    }
  }
}

export const employeeService = new EmployeeService();
