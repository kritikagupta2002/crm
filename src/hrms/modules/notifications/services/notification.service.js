import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

/* Notifications are stored on the server, which already returns only the ones meant for the signed-in person. */
export const notificationService = {
    getNotifications: async () => {
        const res = await api.get('/notifications');
        const list = Array.isArray(res?.data) ? res.data : [];
        storage.setNotifications(list);
        return list;
    },
    markAsRead: async (id) => {
        await api.put(`/notifications/${encodeURIComponent(id)}/read`);
    },
    markAllAsRead: async () => {
        await api.put('/notifications/read-all');
    },
    deleteNotification: async (id) => {
        await api.delete(`/notifications/${encodeURIComponent(id)}`);
    },
};
