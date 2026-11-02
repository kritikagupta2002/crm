import { storage } from '../storage/storage.js';

/*
 * Projects and departments come only from real records: an employee's project is the one on their employment
 * record, and the project/department lists are built from the employee and department masters. Nothing is
 * inferred or invented.
 */
const NO_PROJECT = 'Unassigned';
const BADGE = 'bg-slate-50 text-slate-700 border-slate-200';

export const getEmployeeProject = (emp) => emp?.employment?.project?.trim() || NO_PROJECT;

export const getEmployeeProjectById = (empId) =>
    getEmployeeProject(storage.getEmployees().find((e) => e.employeeId === empId || e.id === empId));

/* Live list of projects currently assigned to employees (read when a page renders). */
export const listProjects = () =>
    [...new Set(storage.getEmployees().map(getEmployeeProject))].sort((a, b) => (a === NO_PROJECT ? 1 : b === NO_PROJECT ? -1 : a.localeCompare(b)));

/* Array-like proxy so existing `STANDARD_PROJECTS.map(...)` filters always show the current project list. */
export const STANDARD_PROJECTS = new Proxy([], {
    get(_target, prop) {
        const list = listProjects();
        const value = list[prop];
        return typeof value === 'function' ? value.bind(list) : value;
    },
});

/* Metadata lookups return the department's real head and location from the department master. */
export const DEPARTMENT_METADATA = new Proxy({}, {
    get(_target, name) {
        const dept = storage.getDepartments().find((d) => d.name === name);
        if (!dept) return undefined;
        return { code: dept.code || '', headName: dept.headName || '', base: dept.location || '', badgeClass: BADGE, desc: dept.description || '' };
    },
});

export const PROJECT_METADATA = new Proxy({}, {
    get() {
        return undefined;
    },
});

/* Department filter/select options from the department master. */
export const departmentOptions = () => storage.getDepartments().map((d) => ({ value: d.name, label: d.name }));
