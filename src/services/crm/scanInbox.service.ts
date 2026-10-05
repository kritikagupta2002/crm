import { mobileStorage } from '../../storage';
import {
  ScanItem,
  GovtDocument,
  GovtDocumentRecord,
} from '../../types';
import { govtDocuments } from '../../constants';

export class ScanInboxService {
  async getScanInbox(): Promise<ScanItem[]> {
    return mobileStorage.getScanInbox();
  }

  async addScans(
    files: Array<{ name: string; size?: number; type?: string }>,
    scanner: string = 'Uploaded'
  ): Promise<ScanItem[]> {
    const inbox = await mobileStorage.getScanInbox();
    const newItems: ScanItem[] = files.map((file) => ({
      id: `SCN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: file.name,
      size: file.size || 1024 * 350,
      type: file.type || 'application/pdf',
      scannedAt: new Date().toISOString(),
      scanner,
    }));
    inbox.unshift(...newItems);
    await mobileStorage.setScanInbox(inbox);
    return inbox;
  }

  async discardScan(scanId: string): Promise<void> {
    const inbox = await mobileStorage.getScanInbox();
    const filtered = inbox.filter((s) => s.id !== scanId);
    await mobileStorage.setScanInbox(filtered);
  }

  async fileScanToProject(
    scanId: string,
    projectId: string,
    letterData: {
      title: string;
      ref: string;
      date: string;
      authority?: string;
      kind?: string;
      pages?: number;
      forStep?: string;
      links?: { leaseNo?: string; vendorId?: string };
    },
    filedBy: string
  ): Promise<GovtDocument> {
    const scanList = await mobileStorage.getScanInbox();
    const scan = scanList.find((s) => s.id === scanId);
    const projects = await mobileStorage.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found.');

    const newLetterId = `GL-${Date.now()}`;
    const newLetter = {
      id: newLetterId,
      title: letterData.title,
      ref: letterData.ref,
      date: letterData.date,
      authority: letterData.authority || (project as any).lead?.company || project.clientName || 'Authority',
      kind: letterData.kind || 'Letter',
      pages: letterData.pages || (scan ? 2 : 1),
      forStep: letterData.forStep,
    };

    project.letters = project.letters || [];
    project.letters.unshift(newLetter);
    await mobileStorage.setProjects(projects);

    const saved = await mobileStorage.getGovtDocRecords();
    const now = new Date().toISOString();
    const links = letterData.links || {};
    const vendors = await mobileStorage.getVendors();
    const company = (project as any).lead?.company || project.clientName || 'Client';

    const vName = links.vendorId ? (vendors.find((v) => v.id === links.vendorId)?.name || links.vendorId) : '';
    const linked = [company, links.leaseNo && `lease ${links.leaseNo}`, vName].filter(Boolean).join(', ');

    const record: GovtDocumentRecord = {
      filedBy,
      filedAt: now,
      links,
      events: [
        ...(scan ? [{ at: scan.scannedAt, by: scan.scanner, text: `Scanned — ${scan.name}, saved to the NAS` }] : []),
        { at: now, by: filedBy, text: `Filed to ${project.id} · linked to ${linked}` },
      ],
    };

    saved[newLetterId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    await this.discardScan(scanId);

    const updatedProjects = await mobileStorage.getProjects();
    const updatedSaved = await mobileStorage.getGovtDocRecords();
    const updatedVendors = await mobileStorage.getVendors();
    const updated = govtDocuments(updatedProjects, updatedSaved, updatedVendors);
    return updated.find((d: GovtDocument) => d.id === newLetterId)!;
  }
}

export const scanInboxService = new ScanInboxService();
