import { storage } from '@/core/storage/storage';
export const documentService = {
    getDocuments: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getDocuments()), 80));
    },
    uploadDocument: async (doc) => {
        const list = storage.getDocuments();
        const newDoc = {
            ...doc,
            id: `cdoc-${Date.now()}`,
            uploadDate: new Date().toLocaleDateString('en-CA'),
        };
        storage.setDocuments([newDoc, ...list]);
        return new Promise(resolve => setTimeout(() => resolve(newDoc), 120));
    },
    deleteDocument: async (id) => {
        const list = storage.getDocuments();
        const filtered = list.filter((d) => d.id !== id);
        storage.setDocuments(filtered);
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
    }
};
