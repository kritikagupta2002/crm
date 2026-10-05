import { mobileStorage } from '../../storage';
import {
  GovtDocument,
  GovtDocumentRecord,
} from '../../types';
import {
  govtDocuments,
  verifyBlock,
  accessLabel,
} from '../../constants';

export class GovtDocumentsService {
  async getGovtDocuments(): Promise<GovtDocument[]> {
    const projects = await mobileStorage.getProjects();
    const saved = await mobileStorage.getGovtDocRecords();
    const vendors = await mobileStorage.getVendors();
    return govtDocuments(projects, saved, vendors);
  }

  async verifyGovtDocument(
    docId: string,
    options: { ok: boolean; reason?: string; note?: string },
    verifierId: string,
    verifierName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const blockReason = verifyBlock(doc, verifierName);
    if (blockReason) {
      throw new Error(blockReason);
    }

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const verifyPatch = options.ok
      ? { status: 'Verified' as const, by: verifierName, at: now }
      : { status: 'Rescan' as const, by: verifierName, at: now, reason: options.reason || 'Wrong document scanned', note: options.note };
    const eventText = options.ok
      ? 'Verified against the original'
      : `Sent back for a rescan: ${options.reason}${options.note ? ` — ${options.note}` : ''}`;

    const record: GovtDocumentRecord = {
      ...base,
      verify: verifyPatch,
      events: [...(base.events || []), { at: now, by: verifierName, text: eventText }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async replaceDocScan(
    docId: string,
    options: { fileName: string; scanId?: string },
    uploaderName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();

    const record: GovtDocumentRecord = {
      ...base,
      verify: null,
      filedBy: uploaderName,
      filedAt: now,
      events: [
        ...(base.events || []),
        { at: now, by: uploaderName, text: `New scan attached (${options.fileName}) — back for verification` },
      ],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    if (options.scanId) {
      const inbox = await mobileStorage.getScanInbox();
      await mobileStorage.setScanInbox(inbox.filter((s) => s.id !== options.scanId));
    }

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async linkGovtDocument(
    docId: string,
    links: { leaseNo?: string; vendorId?: string },
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const nextLinks = { ...base.links, ...links };

    const vendors = await mobileStorage.getVendors();
    const vName = links.vendorId ? (vendors.find((v) => v.id === links.vendorId)?.name || links.vendorId) : 'no vendor';
    const text = `Links updated: ${[links.leaseNo ? `lease ${links.leaseNo}` : 'no lease', vName].join(', ')}`;

    const record: GovtDocumentRecord = {
      ...base,
      links: nextLinks,
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async authorizeGovtDocument(
    docId: string,
    options: { client: boolean; vendor: boolean; original: boolean },
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();

    const vendors = await mobileStorage.getVendors();
    const label = accessLabel({ client: options.client, vendor: options.vendor }, base.links, vendors);
    const text = `Access set: ${label}${options.original ? ' · original to go to the client' : ''}`;

    const record: GovtDocumentRecord = {
      ...base,
      access: { client: options.client, vendor: options.vendor, by: actorName, at: now },
      dispatch: { ...base.dispatch, status: options.original ? 'To dispatch' : 'Not needed' },
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async shareGovtDocument(
    docId: string,
    how: 'WhatsApp' | 'marked',
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const text = how === 'WhatsApp' ? 'Shared with the client — portal and WhatsApp' : 'Marked as shared with the client';

    const record: GovtDocumentRecord = {
      ...base,
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => (p.letters || []).some((l: any) => l.id === docId));
    if (proj && proj.letters) {
      const letIndex = proj.letters.findIndex((l: any) => l.id === docId);
      if (letIndex !== -1) {
        proj.letters[letIndex].sharedOn = now.split('T')[0];
        await mobileStorage.setProjects(projects);
      }
    }

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async requestGovtDocumentDispatch(
    docId: string,
    needed: boolean,
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const text = needed ? 'Original to go to the client' : 'No original to send';

    const record: GovtDocumentRecord = {
      ...base,
      dispatch: { ...base.dispatch, status: needed ? 'To dispatch' : 'Not needed' },
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async dispatchGovtDocument(
    docId: string,
    details: { mode: string; docket: string; on: string },
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const text = `Original sent by ${details.mode}${details.docket ? ` · ${details.docket}` : ''}`;

    const record: GovtDocumentRecord = {
      ...base,
      dispatch: {
        ...base.dispatch,
        status: 'Dispatched',
        mode: details.mode,
        docket: details.docket,
        on: details.on,
        by: actorName,
      },
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const dispatches = await mobileStorage.getDispatches();
    dispatches.unshift({
      id: `disp-${docId}-${Date.now()}`,
      docId,
      docTitle: doc.letter.title,
      recipientName: doc.lead.contactPerson || 'Client Contact',
      recipientOrg: doc.lead.company,
      destination: doc.lead.location || 'Client Office',
      courierName: details.mode,
      waybillNumber: details.docket,
      dispatchDate: details.on,
      status: 'Dispatched',
      mode: details.mode,
      docket: details.docket,
      on: details.on,
    });
    await mobileStorage.setDispatches(dispatches);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }

  async receiveGovtDocument(
    docId: string,
    details: { receivedBy: string; on: string },
    actorName: string
  ): Promise<GovtDocument> {
    const all = await this.getGovtDocuments();
    const doc = all.find((d) => d.id === docId);
    if (!doc) throw new Error('Government document not found.');

    const saved = await mobileStorage.getGovtDocRecords();
    const base = saved[docId] ?? doc.record;
    const now = new Date().toISOString();
    const text = `Original received by ${details.receivedBy}`;

    const record: GovtDocumentRecord = {
      ...base,
      dispatch: {
        ...base.dispatch,
        status: 'Received',
        receivedBy: details.receivedBy,
        receivedOn: details.on,
      },
      events: [...(base.events || []), { at: now, by: actorName, text }],
    };

    saved[docId] = record;
    await mobileStorage.setGovtDocRecords(saved);

    const dispatches = await mobileStorage.getDispatches();
    const targetDisp = dispatches.find((d) => d.docId === docId || d.docTitle === doc.letter.title);
    if (targetDisp) {
      targetDisp.status = 'Received';
      targetDisp.receivedBy = details.receivedBy;
      targetDisp.receivedOn = details.on;
      await mobileStorage.setDispatches(dispatches);
    }

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === docId)!;
  }
}

export const govtDocumentsService = new GovtDocumentsService();
