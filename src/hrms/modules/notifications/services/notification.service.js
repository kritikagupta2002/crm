import { storage } from '@/core/storage/storage';

/* A notice is for everyone, for one side (HR / employees), or for one person (targetEmployeeId). */
const visibleTo = (n, role, employeeId) => {
    if (n.targetEmployeeId) return n.targetEmployeeId === employeeId;
    if (!n.targetRole || n.targetRole === 'all') return true;
    return n.targetRole === role;
};

const whoIsLooking = (role) => {
    const active = storage.getActiveUser();
    return { role: role || active?.role || 'employee', employeeId: active?.employeeId ?? null };
};

export const notificationService = {
    getNotifications: async (role) => {
        const me = whoIsLooking(role);
        const filtered = storage.getNotifications().filter((n) => visibleTo(n, me.role, me.employeeId));
        return new Promise(resolve => setTimeout(() => resolve(filtered), 50));
    },
    markAsRead: async (id) => {
        const list = storage.getNotifications();
        const item = list.find((n) => n.id === id);
        if (item) {
            item.read = true;
            storage.setNotifications([...list]);
        }
    },
    markAllAsRead: async (role) => {
        const me = whoIsLooking(role);
        const list = storage.getNotifications();
        list.forEach((n) => {
            if (visibleTo(n, me.role, me.employeeId)) n.read = true;
        });
        storage.setNotifications([...list]);
    },
    deleteNotification: async (id) => {
        const list = storage.getNotifications();
        const filtered = list.filter((n) => n.id !== id);
        storage.setNotifications(filtered);
    }
};
