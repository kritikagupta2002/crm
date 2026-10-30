import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

export const documentService = {
  // Company Documents
  getDocuments: async () => {
    return storage.getDocuments();
  },

  uploadDocument: async (doc) => {
    const list = storage.getDocuments();
    const newDoc = {
      ...doc,
      id: `cdoc-${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-CA'),
    };
    storage.setDocuments([newDoc, ...list]);
    return newDoc;
  },

  deleteDocument: async (id) => {
    const list = storage.getDocuments();
    const filtered = list.filter((d) => d.id !== id);
    storage.setDocuments(filtered);
    return true;
  },

  // Employee Personal Verification Documents
  getEmployeeDocuments: async (params = {}) => {
    try {
      const res = await api.get('/documents', params);
      if (res && res.success && Array.isArray(res.data)) {
        storage.setEmployeeDocuments(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('[Document Service] Remote API unavailable, using local storage:', e.message);
    }
    return storage.getEmployeeDocuments();
  },

  uploadEmployeeDocument: async (docData) => {
    try {
      const res = await api.post('/documents', docData);
      if (res && res.success && res.data) {
        const list = storage.getEmployeeDocuments();
        storage.setEmployeeDocuments([res.data, ...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Document Service] Remote upload failed, saving locally:', e.message);
    }

    const list = storage.getEmployeeDocuments();
    const newDoc = {
      ...docData,
      id: `pdoc-${Date.now()}`,
      uploadedOn: new Date().toISOString().slice(0, 10),
      status: 'Pending Verification',
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    };
    storage.setEmployeeDocuments([newDoc, ...list]);
    return newDoc;
  },

  reviewEmployeeDocument: async (id, status, comments, reviewerName) => {
    try {
      const res = await api.put(`/documents/${id}/review`, { status, comments, reviewerName });
      if (res && res.success && res.data) {
        const list = storage.getEmployeeDocuments();
        const idx = list.findIndex((d) => d.id === id);
        if (idx >= 0) list[idx] = res.data;
        storage.setEmployeeDocuments([...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Document Service] Remote review failed, updating locally:', e.message);
    }

    const list = storage.getEmployeeDocuments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    const updated = {
      ...list[idx],
      status,
      rejectionReason: status === 'Rejected' ? comments : null,
      reviewedBy: reviewerName || 'Manager',
      reviewedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    storage.setEmployeeDocuments([...list]);
    return updated;
  },

  reuploadEmployeeDocument: async (id, fileData) => {
    try {
      const res = await api.put(`/documents/${id}/reupload`, fileData);
      if (res && res.success && res.data) {
        const list = storage.getEmployeeDocuments();
        const idx = list.findIndex((d) => d.id === id);
        if (idx >= 0) list[idx] = res.data;
        storage.setEmployeeDocuments([...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Document Service] Remote re-upload failed, updating locally:', e.message);
    }

    const list = storage.getEmployeeDocuments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    const updated = {
      ...list[idx],
      ...fileData,
      status: 'Pending Verification',
      rejectionReason: null,
      uploadedOn: new Date().toISOString().slice(0, 10),
      reviewedBy: null,
      reviewedAt: null,
    };
    list[idx] = updated;
    storage.setEmployeeDocuments([...list]);
    return updated;
  },
};
