import { storage } from '@/core/storage/storage';
export const organizationService = {
    getDepartments: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getDepartments()), 80));
    },
    createDepartment: async (dept) => {
        const list = storage.getDepartments();
        const newDept = { ...dept, id: `dept-${Date.now()}` };
        storage.setDepartments([newDept, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newDept), 100));
    },
    updateDepartment: async (id, data) => {
        const list = storage.getDepartments();
        const index = list.findIndex((d) => d.id === id);
        if (index === -1)
            throw new Error('Department not found');
        list[index] = { ...list[index], ...data };
        storage.setDepartments([...list]);
        return new Promise(resolve => setTimeout(() => resolve(list[index]), 100));
    },
    getDesignations: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getDesignations()), 80));
    },
    createDesignation: async (desig) => {
        const list = storage.getDesignations();
        const newDesig = { ...desig, id: `desig-${Date.now()}` };
        storage.setDesignations([newDesig, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newDesig), 100));
    },
    updateDesignation: async (id, data) => {
        const list = storage.getDesignations();
        const index = list.findIndex((d) => d.id === id);
        if (index === -1)
            throw new Error('Designation not found');
        list[index] = { ...list[index], ...data };
        storage.setDesignations([...list]);
        return new Promise(resolve => setTimeout(() => resolve(list[index]), 100));
    },
    deleteDesignation: async (id) => {
        const list = storage.getDesignations();
        const filtered = list.filter((d) => d.id !== id);
        storage.setDesignations(filtered);
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
    }
};
