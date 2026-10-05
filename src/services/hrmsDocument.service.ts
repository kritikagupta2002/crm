import { HrDocument, EmployeeDocumentRecord, StoredAttachment } from '../types';
import { mobileStorage } from '../storage';
import { attachmentStorage } from './attachmentStorage.service';

export interface UploadHrDocInput {
  title: string;
  category: string;
  description?: string;
  uploadedBy: string;
  accessRole?: string;
  attachment?: {
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  };
}

export interface UploadEmployeeDocInput {
  employeeId: string;
  employeeName: string;
  department: string;
  documentType: string;
  expiryDate?: string;
  attachment?: {
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

class HrmsDocumentService {
  validateUpload(params: {
    isEmployeeKyc: boolean;
    title?: string;
    employeeId?: string;
    documentType?: string;
    expiryDate?: string;
    file?: { name: string; size: number; uri: string };
  }): ValidationResult {
    const { isEmployeeKyc, title, employeeId, documentType, expiryDate, file } = params;

    if (!isEmployeeKyc) {
      if (!title || !title.trim()) {
        return { valid: false, error: 'Document title is required.' };
      }
    } else {
      if (!employeeId || !employeeId.trim()) {
        return { valid: false, error: 'Please select an employee.' };
      }
      if (!documentType || !documentType.trim()) {
        return { valid: false, error: 'Document type is required.' };
      }
      const isStatutoryLicense =
        documentType.includes('DGMS') ||
        documentType.includes('Pilot') ||
        documentType.includes('Competency');
      if (isStatutoryLicense && (!expiryDate || !expiryDate.trim())) {
        return {
          valid: false,
          error: 'Certificate validity expiry date is required for statutory DGMS certificates and DGCA drone licenses.',
        };
      }
    }

    if (file) {
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        return {
          valid: false,
          error: `File size exceeds the 10 MB maximum limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        };
      }

      const allowedExts = isEmployeeKyc
        ? ['.pdf', '.png', '.jpg', '.jpeg']
        : ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return {
          valid: false,
          error: `Invalid file format "${ext}". Allowed types: ${allowedExts.join(', ')}.`,
        };
      }
    }

    return { valid: true };
  }

  async getHrDocuments(): Promise<HrDocument[]> {
    return await mobileStorage.getHrDocuments();
  }

  async uploadHrDocument(input: UploadHrDocInput): Promise<HrDocument> {
    const validation = this.validateUpload({
      isEmployeeKyc: false,
      title: input.title,
      file: input.attachment,
    });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let savedAttachment: StoredAttachment | null = null;
    if (input.attachment) {
      savedAttachment = await attachmentStorage.saveAttachment(
        input.attachment.uri,
        input.attachment.name,
        input.attachment.mimeType
      );
    }

    const currentDocs = await mobileStorage.getHrDocuments();
    const newDoc: HrDocument = {
      id: `cdoc-${Date.now()}`,
      title: input.title.trim(),
      category: input.category || 'Company Documents',
      fileName: savedAttachment?.fileName || input.attachment?.name || `${input.title.replace(/\s+/g, '_')}.pdf`,
      fileSize: savedAttachment?.fileSizeFormatted || (input.attachment ? attachmentStorage.formatFileSize(input.attachment.size) : '2.4 MB'),
      fileType: input.attachment?.name.endsWith('.png') || input.attachment?.name.endsWith('.jpg') ? 'IMG' : 'PDF',
      uploadedBy: input.uploadedBy || 'HR Administration',
      uploadDate: new Date().toLocaleDateString('en-CA'),
      description: input.description?.trim() || '',
      accessRole: input.accessRole || 'all',
      attachmentUri: savedAttachment?.fileUri,
      attachmentId: savedAttachment?.id,
      mimeType: savedAttachment?.mimeType,
    };

    const updated = [newDoc, ...currentDocs];
    await mobileStorage.setHrDocuments(updated);
    return newDoc;
  }

  async deleteHrDocument(id: string): Promise<boolean> {
    const currentDocs = await mobileStorage.getHrDocuments();
    const target = currentDocs.find((d) => d.id === id);
    if (!target) return false;

    if (target.attachmentUri) {
      await attachmentStorage.deleteAttachment(target.attachmentUri);
    }

    const filtered = currentDocs.filter((d) => d.id !== id);
    await mobileStorage.setHrDocuments(filtered);
    return true;
  }

  async getEmployeeDocuments(employeeId?: string): Promise<EmployeeDocumentRecord[]> {
    const list = await mobileStorage.getEmployeeDocuments();
    if (employeeId) {
      return list.filter(
        (doc) => doc.employeeId === employeeId || doc.employeeId?.toLowerCase() === employeeId.toLowerCase()
      );
    }
    return list;
  }

  async uploadEmployeeDocument(input: UploadEmployeeDocInput): Promise<EmployeeDocumentRecord> {
    const validation = this.validateUpload({
      isEmployeeKyc: true,
      employeeId: input.employeeId,
      documentType: input.documentType,
      expiryDate: input.expiryDate,
      file: input.attachment,
    });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const currentDocs = await mobileStorage.getEmployeeDocuments();

    const existing = currentDocs.find(
      (d) =>
        d.employeeId === input.employeeId &&
        d.documentType.toLowerCase() === input.documentType.toLowerCase()
    );

    if (existing) {
      return await this.replaceEmployeeDocument(existing.id, input);
    }

    let savedAttachment: StoredAttachment | null = null;
    if (input.attachment) {
      savedAttachment = await attachmentStorage.saveAttachment(
        input.attachment.uri,
        input.attachment.name,
        input.attachment.mimeType
      );
    }

    const newRecord: EmployeeDocumentRecord = {
      id: `doc-rec-${Date.now()}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      department: input.department,
      documentType: input.documentType,
      fileName: savedAttachment?.fileName || input.attachment?.name || `${input.documentType.replace(/\s+/g, '_')}_${input.employeeId}.pdf`,
      fileSize: savedAttachment?.fileSizeFormatted || (input.attachment ? attachmentStorage.formatFileSize(input.attachment.size) : '1.8 MB'),
      uploadedOn: new Date().toLocaleDateString('en-CA'),
      status: 'Pending Review', // Queued for HR verification
      expiryDate: input.expiryDate || undefined,
      attachmentUri: savedAttachment?.fileUri,
      attachmentId: savedAttachment?.id,
      mimeType: savedAttachment?.mimeType,
    };

    const updated = [newRecord, ...currentDocs];
    await mobileStorage.setEmployeeDocuments(updated);
    return newRecord;
  }

  async replaceEmployeeDocument(
    existingDocId: string,
    input: Partial<UploadEmployeeDocInput>
  ): Promise<EmployeeDocumentRecord> {
    const currentDocs = await mobileStorage.getEmployeeDocuments();
    const existingIndex = currentDocs.findIndex((d) => d.id === existingDocId);
    if (existingIndex === -1) {
      throw new Error('Original document record not found for replacement.');
    }

    const existing = currentDocs[existingIndex];

    let savedAttachment: StoredAttachment | null = null;
    if (input.attachment) {
      if (existing.attachmentUri) {
        await attachmentStorage.deleteAttachment(existing.attachmentUri);
      }
      savedAttachment = await attachmentStorage.saveAttachment(
        input.attachment.uri,
        input.attachment.name,
        input.attachment.mimeType
      );
    }

    const updatedRecord: EmployeeDocumentRecord = {
      ...existing,
      fileName: savedAttachment?.fileName || input.attachment?.name || existing.fileName,
      fileSize: savedAttachment?.fileSizeFormatted || (input.attachment ? attachmentStorage.formatFileSize(input.attachment.size) : existing.fileSize),
      uploadedOn: new Date().toLocaleDateString('en-CA'),
      status: 'Pending Review', // Reset to Pending Review on new version/replacement
      expiryDate: input.expiryDate !== undefined ? input.expiryDate : existing.expiryDate,
      attachmentUri: savedAttachment ? savedAttachment.fileUri : existing.attachmentUri,
      attachmentId: savedAttachment ? savedAttachment.id : existing.attachmentId,
      mimeType: savedAttachment ? savedAttachment.mimeType : existing.mimeType,
    };

    currentDocs[existingIndex] = updatedRecord;
    await mobileStorage.setEmployeeDocuments([...currentDocs]);
    return updatedRecord;
  }

  async verifyEmployeeDocument(docId: string): Promise<EmployeeDocumentRecord> {
    const currentDocs = await mobileStorage.getEmployeeDocuments();
    const target = currentDocs.find((d) => d.id === docId);
    if (!target) {
      throw new Error('Document record not found');
    }

    const updatedRecord: EmployeeDocumentRecord = {
      ...target,
      status: 'Verified',
    };

    const updatedList = currentDocs.map((d) => (d.id === docId ? updatedRecord : d));
    await mobileStorage.setEmployeeDocuments(updatedList);
    return updatedRecord;
  }

  async deleteEmployeeDocument(docId: string): Promise<boolean> {
    const currentDocs = await mobileStorage.getEmployeeDocuments();
    const target = currentDocs.find((d) => d.id === docId);
    if (!target) return false;

    if (target.attachmentUri) {
      await attachmentStorage.deleteAttachment(target.attachmentUri);
    }

    const filtered = currentDocs.filter((d) => d.id !== docId);
    await mobileStorage.setEmployeeDocuments(filtered);
    return true;
  }
}

export const hrmsDocumentService = new HrmsDocumentService();
