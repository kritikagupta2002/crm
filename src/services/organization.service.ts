import { mobileStorage } from '../storage';
import { Department, Designation, Employee } from '../types';

export interface HierarchyNode {
  department: Department;
  designations: {
    designation: Designation;
    employees: Employee[];
  }[];
  totalStaff: number;
}

export class OrganizationService {
  // ============================================================
  // DEPARTMENTS
  // ============================================================

  async getDepartments(): Promise<Department[]> {
    const departments = await mobileStorage.getDepartments();
    const employees = await mobileStorage.getEmployees();

    // Dynamically compute real live staff count from Employee Master (Zero Fake Numbers)
    return departments.map((dept) => {
      const liveCount = employees.filter(
        (e) =>
          e.employment?.department?.toLowerCase() === dept.name.toLowerCase() &&
          e.employment?.status === 'Active'
      ).length;

      return {
        ...dept,
        staffCount: liveCount || dept.staffCount || 0,
        employeeCount: liveCount || dept.employeeCount || 0,
      };
    });
  }

  async createDepartment(data: {
    name: string;
    code: string;
    headName?: string;
    headEmployeeId?: string;
    location?: string;
    description?: string;
  }): Promise<Department> {
    const trimmedName = data.name.trim();
    const trimmedCode = data.code.trim().toUpperCase();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Department Name is required and must be at least 2 characters.');
    }
    if (!trimmedCode || trimmedCode.length < 2 || trimmedCode.length > 10) {
      throw new Error('Department Code is required (2 to 10 characters).');
    }

    const departments = await mobileStorage.getDepartments();

    // Uniqueness checks
    const duplicateName = departments.find(
      (d) => d.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      throw new Error(`A department named "${trimmedName}" already exists.`);
    }

    const duplicateCode = departments.find(
      (d) => d.code.toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
      throw new Error(`Department Code "${trimmedCode}" is already in use by "${duplicateCode.name}".`);
    }

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      headName: data.headName?.trim() || 'Dr. Amit Kumar Bansal',
      headEmployeeId: data.headEmployeeId || 'BGS-001',
      location: data.location?.trim() || 'Jaipur Corporate HQ',
      description: data.description?.trim() || '',
      staffCount: 0,
      employeeCount: 0,
      status: 'Active',
    };

    departments.push(newDept);
    await mobileStorage.setDepartments(departments);
    return newDept;
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    const departments = await mobileStorage.getDepartments();
    const index = departments.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Department not found.');
    }

    const current = departments[index];
    if (updates.name && updates.name.trim().toLowerCase() !== current.name.toLowerCase()) {
      const duplicate = departments.find(
        (d) => d.id !== id && d.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Department "${updates.name}" already exists.`);
      }
    }

    const updated: Department = {
      ...current,
      ...updates,
      name: updates.name ? updates.name.trim() : current.name,
      code: updates.code ? updates.code.trim().toUpperCase() : current.code,
    };

    departments[index] = updated;
    await mobileStorage.setDepartments(departments);
    return updated;
  }

  async deleteDepartment(id: string): Promise<void> {
    const departments = await mobileStorage.getDepartments();
    const dept = departments.find((d) => d.id === id);
    if (!dept) throw new Error('Department not found.');

    // Check if staff are assigned
    const employees = await mobileStorage.getEmployees();
    const assignedStaff = employees.filter(
      (e) => e.employment?.department?.toLowerCase() === dept.name.toLowerCase()
    );
    if (assignedStaff.length > 0) {
      throw new Error(
        `Cannot delete department "${dept.name}": ${assignedStaff.length} employee(s) are currently assigned to this department. Reassign staff first.`
      );
    }

    const filtered = departments.filter((d) => d.id !== id);
    await mobileStorage.setDepartments(filtered);
  }

  // ============================================================
  // DESIGNATIONS
  // ============================================================

  async getDesignations(): Promise<Designation[]> {
    const designations = await mobileStorage.getDesignations();
    const employees = await mobileStorage.getEmployees();

    // Dynamically compute real live assigned staff count per designation (Zero Fake Numbers)
    return designations.map((desig) => {
      const liveCount = employees.filter(
        (e) =>
          (e.employment?.designation?.toLowerCase() === desig.title.toLowerCase() ||
            e.employment?.designationCode?.toUpperCase() === desig.code.toUpperCase()) &&
          e.employment?.status === 'Active'
      ).length;

      return {
        ...desig,
        assignedStaffCount: liveCount,
        employeeCount: liveCount,
      };
    });
  }

  async createDesignation(data: {
    code: string;
    title: string;
    grade?: string;
    level?: string;
    departmentId?: string;
    departmentName?: string;
    department?: string;
    minExperience?: string;
    status?: 'Active' | 'Inactive';
  }): Promise<Designation> {
    const trimmedTitle = data.title.trim();
    const trimmedCode = data.code.trim().toUpperCase();

    // Validation 1: Title (3 to 60 characters)
    if (!trimmedTitle || trimmedTitle.length < 3) {
      throw new Error('Designation Title must be at least 3 characters.');
    }
    if (trimmedTitle.length > 60) {
      throw new Error('Designation Title cannot exceed 60 characters.');
    }

    // Validation 2: Code (2 to 12 uppercase alphanumeric characters)
    if (!trimmedCode || trimmedCode.length < 2) {
      throw new Error('Designation Code must be at least 2 characters.');
    }
    if (trimmedCode.length > 12) {
      throw new Error('Designation Code cannot exceed 12 characters.');
    }
    if (!/^[A-Z0-9-]+$/.test(trimmedCode)) {
      throw new Error('Designation Code must only contain uppercase letters, numbers, and hyphens (e.g. SR-GEO).');
    }

    // Validation 3: Department Required
    const deptName = data.departmentName || data.department || 'Geology & Mineral Exploration';

    const designations = await mobileStorage.getDesignations();

    // Uniqueness checks
    const duplicateTitle = designations.find(
      (d) => d.title.toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (duplicateTitle) {
      throw new Error(`A designation titled "${trimmedTitle}" already exists.`);
    }

    const duplicateCode = designations.find(
      (d) => d.code.toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
      throw new Error(`Code "${trimmedCode}" is already in use by "${duplicateCode.title}".`);
    }

    const newDesig: Designation = {
      id: `desig-${Date.now()}`,
      code: trimmedCode,
      title: trimmedTitle,
      grade: data.grade || data.level || 'L3',
      level: data.level || data.grade || 'L3',
      departmentId: data.departmentId || 'dept-geo',
      departmentName: deptName,
      department: deptName,
      minExperience: data.minExperience || '3-5 Years',
      assignedStaffCount: 0,
      employeeCount: 0,
      status: data.status || 'Active',
    };

    designations.push(newDesig);
    await mobileStorage.setDesignations(designations);
    return newDesig;
  }

  async updateDesignation(id: string, updates: Partial<Designation>): Promise<Designation> {
    const designations = await mobileStorage.getDesignations();
    const index = designations.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Designation not found.');
    }

    const current = designations[index];

    if (updates.title && updates.title.trim().toLowerCase() !== current.title.toLowerCase()) {
      const duplicate = designations.find(
        (d) => d.id !== id && d.title.toLowerCase() === updates.title!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error(`A designation titled "${updates.title}" already exists.`);
      }
    }

    if (updates.code && updates.code.trim().toUpperCase() !== current.code.toUpperCase()) {
      const duplicate = designations.find(
        (d) => d.id !== id && d.code.toUpperCase() === updates.code!.trim().toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Code "${updates.code}" is already in use.`);
      }
    }

    const updated: Designation = {
      ...current,
      ...updates,
      title: updates.title ? updates.title.trim() : current.title,
      code: updates.code ? updates.code.trim().toUpperCase() : current.code,
      grade: updates.grade || updates.level || current.grade,
      level: updates.level || updates.grade || current.level,
      departmentName: updates.departmentName || updates.department || current.departmentName,
      department: updates.department || updates.departmentName || current.department,
    };

    designations[index] = updated;
    await mobileStorage.setDesignations(designations);
    return updated;
  }

  // ============================================================
  // CRITICAL SAFETY GUARD: DELETION RESTRICTION
  // CanDeleteDesignation(designation) = AssignedStaffCount === 0
  // ============================================================
  async deleteDesignation(id: string): Promise<void> {
    const designations = await mobileStorage.getDesignations();
    const target = designations.find((d) => d.id === id);
    if (!target) throw new Error('Designation not found.');

    const employees = await mobileStorage.getEmployees();

    // Check 1: Live assigned staff query
    const activeAssigned = employees.filter(
      (e) =>
        (e.employment?.designation?.toLowerCase() === target.title.toLowerCase() ||
          e.employment?.designationCode?.toUpperCase() === target.code.toUpperCase()) &&
        e.employment?.status === 'Active'
    );

    const totalAssigned = Math.max(activeAssigned.length, target.assignedStaffCount || 0);

    if (totalAssigned > 0) {
      throw new Error(
        `Cannot delete designation with active staff assigned. (${totalAssigned} active employee(s) currently hold "${target.title}"). Please reassign or update staff records first.`
      );
    }

    const filtered = designations.filter((d) => d.id !== id);
    await mobileStorage.setDesignations(filtered);
  }

  // ============================================================
  // HIERARCHY TREE BUILDER
  // ============================================================
  async getOrganizationHierarchy(): Promise<HierarchyNode[]> {
    const departments = await this.getDepartments();
    const designations = await this.getDesignations();
    const employees = await mobileStorage.getEmployees();

    return departments.map((dept) => {
      // Find all designations under this department
      const deptDesigs = designations.filter(
        (d) =>
          d.departmentId === dept.id ||
          d.departmentName?.toLowerCase() === dept.name.toLowerCase() ||
          d.department?.toLowerCase() === dept.name.toLowerCase()
      );

      // Map employees to each designation
      const mappedDesigs = deptDesigs.map((desig) => {
        const staff = employees.filter(
          (e) =>
            (e.employment?.designation?.toLowerCase() === desig.title.toLowerCase() ||
              e.employment?.designationCode?.toUpperCase() === desig.code.toUpperCase()) &&
            e.employment?.status === 'Active'
        );

        return {
          designation: desig,
          employees: staff,
        };
      });

      const totalDeptStaff = mappedDesigs.reduce((acc, d) => acc + d.employees.length, 0);

      return {
        department: dept,
        designations: mappedDesigs,
        totalStaff: totalDeptStaff,
      };
    });
  }
}

export const organizationService = new OrganizationService();
