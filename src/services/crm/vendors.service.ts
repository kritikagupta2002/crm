import { mobileStorage } from '../../storage';
import { Vendor, VendorApplication } from '../../types';

export class VendorsService {
  async getVendors(): Promise<Vendor[]> {
    return mobileStorage.getVendors();
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const list = await mobileStorage.getVendors();
    return list.find((v) => v.id === id);
  }

  async addVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
    const list = await mobileStorage.getVendors();
    const id = `VN-${String(list.length + 1).padStart(2, '0')}`;
    const newVendor: Vendor = {
      ...data,
      id,
      since: data.since || new Date().toISOString().split('T')[0],
      categories: data.categories || (data.work ? data.work.split(',').map((s) => s.trim()) : []),
    };
    list.unshift(newVendor);
    await mobileStorage.setVendors(list);
    return newVendor;
  }

  async updateVendor(id: string, patch: Partial<Vendor>): Promise<Vendor> {
    const list = await mobileStorage.getVendors();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vendor not found.');
    list[index] = { ...list[index], ...patch };
    await mobileStorage.setVendors(list);
    return list[index];
  }

  async getVendorApplications(): Promise<VendorApplication[]> {
    return mobileStorage.getVendorApplications();
  }

  async submitVendorApplication(
    details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>,
    files?: any[]
  ): Promise<VendorApplication> {
    const apps = await mobileStorage.getVendorApplications();
    const year = new Date().getFullYear();
    const highest = apps.reduce((max, a) => Math.max(max, Number(a.id.split('-').pop()) || 0), 0);
    const id = `VR-${year}-${String(highest + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const appDocs = (files || []).map((f, i) => ({
      id: `doc-${Date.now()}-${i}`,
      name: f.name || f.file?.name || `Document-${i + 1}.pdf`,
      kind: f.kind || 'Other',
      size: f.size || 1500000,
      uploadedAt: now,
      url: f.url || '',
    }));

    const newApp: VendorApplication = {
      ...details,
      id,
      submittedAt: now,
      status: 'New',
      documents: appDocs.length > 0 ? appDocs : (details.documents || []),
      history: [{ at: now, action: 'Submitted', by: details.contact?.name || 'Applicant' }],
    };

    apps.unshift(newApp);
    await mobileStorage.setVendorApplications(apps);
    return newApp;
  }

  async resubmitVendorApplication(id: string, details: Partial<VendorApplication>, files?: any[]): Promise<VendorApplication> {
    const apps = await mobileStorage.getVendorApplications();
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error('Application not found.');
    const now = new Date().toISOString();

    const newDocs = (files || []).map((f, i) => ({
      id: `doc-${Date.now()}-${i}`,
      name: f.name || f.file?.name || `Document-${i + 1}.pdf`,
      kind: f.kind || 'Other',
      size: f.size || 1500000,
      uploadedAt: now,
      url: f.url || '',
    }));

    Object.assign(app, {
      ...details,
      status: 'New' as const,
      note: undefined,
      documents: [...(app.documents || []), ...newDocs],
      history: [...(app.history || []), { at: now, action: 'Resubmitted with changes', by: details.contact?.name || app.contact?.name || 'Applicant' }],
    });

    await mobileStorage.setVendorApplications(apps);
    return app;
  }

  async decideVendorApplication(
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }
  ): Promise<{ application: VendorApplication; vendor?: Vendor }> {
    const apps = await mobileStorage.getVendorApplications();
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error('Application not found.');

    const now = new Date().toISOString();
    const by = options?.actorName || 'Admin';
    let createdVendor: Vendor | undefined;

    if (decision === 'approved') {
      const vendors = await mobileStorage.getVendors();
      const vendorId = `VN-${String(vendors.length + 1).padStart(2, '0')}`;
      createdVendor = {
        id: vendorId,
        name: app.firm.name,
        work: app.work.categories.join(', '),
        categories: app.work.categories,
        place: app.address.city,
        contact: app.contact.name,
        phone: app.contact.mobile.replace(/[^0-9]/g, '').slice(-10),
        email: app.contact.email,
        gstin: app.tax.gstRegistered ? (app.tax.gstin || '').toUpperCase() : '',
        pan: (app.tax.pan || '').toUpperCase(),
        tds: {
          section: '194C',
          rate: options?.tdsRate !== undefined ? options.tdsRate : (app.firm.companyType === 'Individual' ? 0.01 : 0.02),
        },
        bank: {
          name: [app.bank.bank, app.bank.branch].filter(Boolean).join(', '),
          accountNo: app.bank.accountNo,
          ifsc: (app.bank.ifsc || '').toUpperCase(),
        },
        address: app.address,
        applicationId: id,
        since: new Date().toISOString().split('T')[0],
      };
      if (createdVendor) {
        vendors.unshift(createdVendor);
        await mobileStorage.setVendors(vendors);
      }

      app.status = 'Approved';
      app.vendorId = vendorId;
      app.decidedAt = now;
      app.history.push({ at: now, action: 'Approved', by, note: `Enrolled as ${vendorId}` });
    } else if (decision === 'changes_requested') {
      app.status = 'Changes requested';
      app.note = options?.note || 'Please update documents/details and resubmit';
      app.decidedAt = now;
      app.history.push({ at: now, action: 'Sent back for changes', by, note: options?.note });
    } else {
      app.status = 'Rejected';
      app.reason = options?.reason || 'Compliance criteria not met';
      app.note = options?.note || undefined;
      app.decidedAt = now;
      app.history.push({ at: now, action: 'Rejected', by, note: [options?.reason, options?.note].filter(Boolean).join(' — ') });
    }

    await mobileStorage.setVendorApplications(apps);
    return { application: app, vendor: createdVendor };
  }
}

export const vendorsService = new VendorsService();
