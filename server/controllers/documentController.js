import { db } from '../services/db.js';

export const documentController = {
  // Get documents (filtered by employeeId, status, department)
  getAll: async (req, res, next) => {
    try {
      const { employeeId, status, department } = req.query;
      let documents = db.get('employee_documents') || [];

      // If requested by an employee who is not HR/Manager, restrict to their own documents
      if (req.user && req.user.role === 'Employee' && req.user.employeeId) {
        documents = documents.filter((d) => d.employeeId === req.user.employeeId);
      } else if (employeeId) {
        documents = documents.filter((d) => d.employeeId === employeeId);
      }

      if (status && status !== 'All') {
        documents = documents.filter((d) => d.status === status);
      }
      if (department && department !== 'All') {
        documents = documents.filter((d) => d.department === department);
      }

      res.json({
        success: true,
        count: documents.length,
        data: documents,
      });
    } catch (err) {
      next(err);
    }
  },

  // Employee uploads personal document for verification
  upload: async (req, res, next) => {
    try {
      const { employeeId, employeeName, department, documentType, fileName, fileSize = '1.8 MB', fileUrl = '', expiryDate } = req.body;

      if (!employeeId || !documentType) {
        return res.status(400).json({ success: false, error: 'Employee ID and Document Type are required.' });
      }

      const employees = db.get('employees') || [];
      const emp = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);

      const documents = db.get('employee_documents') || [];
      const newDoc = {
        id: `pdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId,
        employeeName: employeeName || emp?.name || 'Staff Member',
        department: department || emp?.employment?.department || 'Operations',
        documentType,
        fileName: fileName || `${documentType.replace(/\s+/g, '_')}_${employeeId}.pdf`,
        fileSize,
        fileUrl,
        uploadedOn: new Date().toISOString().slice(0, 10),
        status: 'Pending Verification',
        expiryDate: expiryDate || null,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      };

      db.set('employee_documents', [newDoc, ...documents]);

      // Trigger in-app notification for Manager and HR
      const notifications = db.get('notifications') || [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'New Document Uploaded for Verification',
        message: `${newDoc.employeeName} (${newDoc.employeeId}) uploaded ${newDoc.documentType} for verification.`,
        type: 'Document',
        priority: 'normal',
        targetRole: 'Manager',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      db.set('notifications', notifications);

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully and queued for manager verification.',
        data: newDoc,
      });
    } catch (err) {
      next(err);
    }
  },

  // Manager or HR accepts or rejects document with reason
  review: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, comments, reviewerName } = req.body;

      if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Verified or Rejected.' });
      }

      if (status === 'Rejected' && (!comments || !comments.trim())) {
        return res.status(400).json({ success: false, error: 'A comment/reason for rejection is mandatory when rejecting a document.' });
      }

      const documents = db.get('employee_documents') || [];
      const docIndex = documents.findIndex((d) => d.id === id);

      if (docIndex === -1) {
        return res.status(404).json({ success: false, error: 'Document record not found.' });
      }

      const reviewer = reviewerName || req.user?.name || 'Manager';
      const reviewedDoc = {
        ...documents[docIndex],
        status,
        rejectionReason: status === 'Rejected' ? comments.trim() : null,
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
      };

      documents[docIndex] = reviewedDoc;
      db.set('employee_documents', documents);

      // Notify the employee about the verification outcome
      const notifications = db.get('notifications') || [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: status === 'Verified' ? 'Document Verified' : 'Document Rejected - Re-upload Required',
        message:
          status === 'Verified'
            ? `Your ${reviewedDoc.documentType} has been approved and verified by ${reviewer}.`
            : `Your ${reviewedDoc.documentType} was rejected by ${reviewer}. Reason: "${comments.trim()}". Please re-upload a compliant copy.`,
        type: 'Document',
        priority: status === 'Rejected' ? 'high' : 'normal',
        targetEmployeeId: reviewedDoc.employeeId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      db.set('notifications', notifications);

      res.json({
        success: true,
        message: `Document successfully ${status.toLowerCase()}.`,
        data: reviewedDoc,
      });
    } catch (err) {
      next(err);
    }
  },

  // Employee re-uploads a rejected document
  reupload: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fileName, fileSize = '1.8 MB', fileUrl = '' } = req.body;

      const documents = db.get('employee_documents') || [];
      const docIndex = documents.findIndex((d) => d.id === id);

      if (docIndex === -1) {
        return res.status(404).json({ success: false, error: 'Document record not found.' });
      }

      const prev = documents[docIndex];
      const updatedDoc = {
        ...prev,
        fileName: fileName || prev.fileName,
        fileSize,
        fileUrl: fileUrl || prev.fileUrl,
        uploadedOn: new Date().toISOString().slice(0, 10),
        status: 'Pending Verification',
        rejectionReason: null, // Clear old rejection
        previousRejection: prev.rejectionReason,
        reviewedBy: null,
        reviewedAt: null,
      };

      documents[docIndex] = updatedDoc;
      db.set('employee_documents', documents);

      // Notify manager of re-upload
      const notifications = db.get('notifications') || [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Document Re-uploaded for Review',
        message: `${updatedDoc.employeeName} re-uploaded ${updatedDoc.documentType} for review following previous feedback.`,
        type: 'Document',
        priority: 'normal',
        targetRole: 'Manager',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      db.set('notifications', notifications);

      res.json({
        success: true,
        message: 'Document re-uploaded successfully and submitted for manager verification.',
        data: updatedDoc,
      });
    } catch (err) {
      next(err);
    }
  },
};
