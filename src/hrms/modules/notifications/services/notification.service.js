import { storage } from '@/core/storage/storage';
export const notificationService = {
    getNotifications: async (role) => {
        const list = storage.getNotifications();
        const activeRole = role || storage.getActiveUser()?.role || 'employee';
        const filtered = list.filter((n) => {
            if (!n.targetRole || n.targetRole === 'all')
                return true;
            return n.targetRole === activeRole;
        });
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
    markAllAsRead: async () => {
        const list = storage.getNotifications();
        list.forEach((n) => { n.read = true; });
        storage.setNotifications([...list]);
    },
    deleteNotification: async (id) => {
        const list = storage.getNotifications();
        const filtered = list.filter((n) => n.id !== id);
        storage.setNotifications(filtered);
    }
};
