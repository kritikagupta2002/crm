import { mobileStorage } from '../../storage';
import { DocumentItem } from '../../types';

export class DocumentsService {
  async getDocuments(): Promise<DocumentItem[]> {
    return mobileStorage.getDocuments();
  }

  async verifyDocument(docId: string, verifierId: string, verifierName: string, remarks: string): Promise<DocumentItem> {
    const docs = await mobileStorage.getDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found.');

    if (doc.uploadedBy === verifierId) {
      throw new Error('You filed this scan, so someone else must verify it.');
    }

    doc.isVerified = true;
    doc.verifiedBy = verifierId;
    doc.verifierName = verifierName;
    doc.verificationRemarks = remarks;
    await mobileStorage.setDocuments(docs);
    return doc;
  }
}

export const documentsService = new DocumentsService();
