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

  // Employee verification documents: stored and reviewed on the server.
  getEmployeeDocuments: async (params = {}) => {
    const res = await api.get('/documents', params);
    const list = Array.isArray(res?.data) ? res.data : [];
    if (!Object.keys(params).length) storage.setEmployeeDocuments(list);
    return list;
  },

  uploadEmployeeDocument: async (docData) => {
    const res = await api.post('/documents', docData);
    storage.setEmployeeDocuments([res.data, ...storage.getEmployeeDocuments()]);
    return res.data;
  },

  reviewEmployeeDocument: async (id, status, comments) => {
    const res = await api.put(`/documents/${encodeURIComponent(id)}/review`, { status, comments });
    storage.setEmployeeDocuments(storage.getEmployeeDocuments().map((d) => (d.id === id ? res.data : d)));
    return res.data;
  },

  reuploadEmployeeDocument: async (id, fileData) => {
    const res = await api.put(`/documents/${encodeURIComponent(id)}/reupload`, fileData);
    storage.setEmployeeDocuments(storage.getEmployeeDocuments().map((d) => (d.id === id ? res.data : d)));
    return res.data;
  },
};
