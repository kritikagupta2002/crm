import { mobileStorage } from '../../storage';
import {
  Tender,
  SealedBid,
  TenderClarification,
  WorkOrder,
} from '../../types';

export class TendersService {
  async getTenders(): Promise<Tender[]> {
    return mobileStorage.getTenders();
  }

  async getTenderById(id: string): Promise<Tender | undefined> {
    const list = await mobileStorage.getTenders();
    return list.find((t) => t.id === id);
  }

  async publishTender(tenderData: Partial<Tender>, files?: any[]): Promise<Tender> {
    const tenders = await mobileStorage.getTenders();
    const year = new Date().getFullYear();
    const n = String(tenders.length + 1).padStart(3, '0');
    const id = `TN-${year}-${n}`;
    const now = new Date().toISOString();

    const tenderDocs = (files || []).map((f, i) => ({
      id: `doc-ten-${Date.now()}-${i}`,
      name: f.name || `TenderDoc-${i + 1}.pdf`,
      kind: f.kind || 'Tender Notice',
      size: f.size || 2000000,
      uploadedAt: now,
      url: f.url || '',
    }));

    const newTender: Tender = {
      id,
      refNo: `BG/VW/${year}-${String((year + 1) % 100).padStart(2, '0')}/${n}`,
      title: tenderData.title || 'Subcontract Works',
      category: tenderData.category || 'Exploration Drilling',
      estimatedValue: Number(tenderData.estimatedValue) || 1000000,
      emdAmount: Number(tenderData.emdAmount) || 20000,
      publishedAt: now,
      closesAt: tenderData.closesAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      openingDate: tenderData.openingDate || new Date(Date.now() + 15 * 86400000).toISOString(),
      technicalRequirements: tenderData.technicalRequirements || ['Relevant experience', 'Equipment ownership/lease'],
      status: 'Open',
      sealedBids: [],
      documents: tenderDocs.length > 0 ? tenderDocs : (tenderData.documents || []),
      authority: tenderData.authority || { name: 'Director', designation: 'Director, BGSPL', address: 'Jaipur, Rajasthan' },
      history: [{ at: now, action: 'Published · All approved vendors notified', by: 'Director' }],
      forProject: tenderData.forProject,
      location: tenderData.location || 'Rajasthan Site',
      service: tenderData.service || 'Mineral Exploration & Resources',
    };

    tenders.unshift(newTender);
    await mobileStorage.setTenders(tenders);
    return newTender;
  }

  async closeBidding(tenderId: string, actorName?: string): Promise<Tender> {
    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');
    const now = new Date().toISOString();
    tender.closedEarlyAt = now;
    tender.status = 'Under Evaluation';
    tender.history = tender.history || [];
    tender.history.push({ at: now, action: 'Bidding closed early · bids unsealed chamber enabled', by: actorName || 'Admin' });
    await mobileStorage.setTenders(tenders);
    return tender;
  }

  async submitSealedBid(tenderId: string, vendorId: string, vendorName: string, bidAmount: number): Promise<void> {
    await this.submitBidWithDetails(tenderId, { vendorId, vendorName, bidAmount });
  }

  async submitBidWithDetails(
    tenderId: string,
    bidData: {
      vendorId: string;
      vendorName: string;
      bidAmount: number;
      technicalSpecs?: string;
      timelineWeeks?: number;
      documents?: any[];
      contactPerson?: string;
      contactPhone?: string;
      remarks?: string;
    }
  ): Promise<SealedBid> {
    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');

    const existingIndex = tender.sealedBids.findIndex((b) => b.vendorId === bidData.vendorId);
    if (existingIndex >= 0 && tender.sealedBids[existingIndex].status === 'Withdrawn') {
      throw new Error('A withdrawn bid cannot be resubmitted for this tender.');
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const n = String(tender.sealedBids.length + 1).padStart(2, '0');
    const bidId = existingIndex >= 0 ? tender.sealedBids[existingIndex].id : `BD-${tender.id.split('-').pop()}-${n}`;

    const newBid: SealedBid = {
      id: bidId,
      tenderId,
      vendorId: bidData.vendorId,
      vendorName: bidData.vendorName,
      bidAmount: Number(bidData.bidAmount),
      submissionDate: today,
      isSealed: true,
      technicalSpecs: bidData.technicalSpecs || '',
      timelineWeeks: bidData.timelineWeeks || 4,
      documents: bidData.documents || [],
      contactPerson: bidData.contactPerson,
      contactPhone: bidData.contactPhone,
      remarks: bidData.remarks,
      status: 'Submitted',
      submittedAt: now,
      history: [{ at: now, action: existingIndex >= 0 ? 'Bid revised' : 'Bid submitted', by: bidData.vendorName }],
    };

    if (existingIndex >= 0) {
      tender.sealedBids[existingIndex] = newBid;
    } else {
      tender.sealedBids.push(newBid);
    }

    tender.history = tender.history || [];
    tender.history.push({ at: now, action: `Sealed bid ${bidId} received`, by: 'Vendor' });
    await mobileStorage.setTenders(tenders);
    return newBid;
  }

  async withdrawBid(tenderId: string, vendorId: string, actorName?: string): Promise<void> {
    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');
    const bid = tender.sealedBids.find((b) => b.vendorId === vendorId);
    if (!bid) throw new Error('Bid not found.');

    const now = new Date().toISOString();
    bid.status = 'Withdrawn';
    bid.withdrawnAt = now;
    bid.history = bid.history || [];
    bid.history.push({ at: now, action: 'Withdrawn by firm', by: actorName || bid.vendorName });

    await mobileStorage.setTenders(tenders);
  }

  async unsealTenderBids(tenderId: string, directorKeyConfirmed: boolean, tenderManagerKeyConfirmed: boolean): Promise<Tender> {
    if (!directorKeyConfirmed || !tenderManagerKeyConfirmed) {
      throw new Error('Dual-Key Authentication required: Both Director and Tender Manager keys must confirm to unseal bids.');
    }

    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');

    const now = new Date().toISOString();
    const liveBids = tender.sealedBids.filter((b) => b.status !== 'Withdrawn');
    liveBids.forEach((b) => {
      b.isSealed = false;
      b.unsealedAt = now;
    });

    liveBids.sort((a, b) => a.bidAmount - b.bidAmount);
    liveBids.forEach((b, idx) => {
      b.rank = idx + 1;
    });

    tender.status = 'Under Evaluation';
    tender.history = tender.history || [];
    tender.history.push({ at: now, action: 'Dual-key unsealing ceremony executed. Comparative matrix generated.', by: 'Director & Tender Manager' });
    await mobileStorage.setTenders(tenders);
    return tender;
  }

  async decideBid(tenderId: string, bidId: string, decision: 'shortlist' | 'reject', options?: { reason?: string; note?: string; actorName?: string }): Promise<Tender> {
    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');
    const bid = tender.sealedBids.find((b) => b.id === bidId);
    if (!bid) throw new Error('Bid not found.');

    const now = new Date().toISOString();
    const status = decision === 'shortlist' ? 'Shortlisted' : 'Rejected';
    bid.status = status;
    if (decision === 'reject') {
      bid.reason = options?.reason;
      bid.remark = options?.note;
    }
    bid.history = bid.history || [];
    bid.history.push({ at: now, action: status, by: options?.actorName || 'Admin', note: options?.reason });

    await mobileStorage.setTenders(tenders);
    return tender;
  }

  async allotTender(tenderId: string, vendorId: string, vendorName: string, contractAmount: number, projectTitle?: string, remarks?: string): Promise<WorkOrder> {
    const tenders = await mobileStorage.getTenders();
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Tender not found.');

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const workOrders = await mobileStorage.getWorkOrders();
    const woNumber = `SC-001-${workOrders.length + 1}`;

    tender.sealedBids.forEach((b) => {
      if (b.vendorId === vendorId && b.status !== 'Withdrawn') {
        b.status = 'Allotted';
        b.history = b.history || [];
        b.history.push({ at: now, action: `Allotted · Work Order ${woNumber}`, by: 'Director' });
      } else if (b.status === 'Submitted' || b.status === 'Shortlisted') {
        b.status = 'Not selected';
        b.history = b.history || [];
        b.history.push({ at: now, action: 'Not selected', by: 'Director' });
      }
    });

    tender.status = 'Awarded';
    tender.awardedToVendorId = vendorId;
    tender.awardedAmount = contractAmount;
    tender.allotted = {
      bidId: tender.sealedBids.find((b) => b.vendorId === vendorId)?.id || '',
      vendorId,
      orderId: woNumber,
      projectId: tender.forProject || 'prj-001',
      at: now,
    };
    tender.history = tender.history || [];
    tender.history.push({ at: now, action: `Tender allotted to ${vendorName} · WO ${woNumber}`, by: 'Director' });
    await mobileStorage.setTenders(tenders);

    const newWO: WorkOrder = {
      id: 'wo-' + Date.now(),
      woNumber,
      tenderId: tender.id,
      vendorId,
      vendorName,
      vendor: vendorName,
      work: tender.title,
      projectId: 'prj-001',
      projectTitle: projectTitle || tender.forProject || tender.title,
      contractValue: Number(contractAmount),
      amount: Number(contractAmount),
      billedAmount: 0,
      paidAmount: 0,
      currentStage: 'Issued',
      status: 'Issued',
      issuedOn: today,
      dueOn: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      milestoneBills: [],
      history: [{ at: now, action: 'Work Order Issued', by: 'Director' }],
    };

    workOrders.unshift(newWO);
    await mobileStorage.setWorkOrders(workOrders);
    return newWO;
  }

  async getClarifications(tenderId?: string): Promise<TenderClarification[]> {
    const list = await mobileStorage.getClarifications();
    if (tenderId) {
      return list.filter((c) => c.tenderId === tenderId);
    }
    return list;
  }

  async askClarification(tenderId: string, question: string, vendorId: string, vendorName: string): Promise<TenderClarification> {
    const list = await mobileStorage.getClarifications();
    const count = list.filter((c) => c.tenderId === tenderId).length + 1;
    const id = `CL-${tenderId.split('-').pop()}-${String(count).padStart(2, '0')}`;
    const now = new Date().toISOString();

    const newClarification: TenderClarification = {
      id,
      tenderId,
      vendorId,
      vendorName,
      question,
      askedAt: now,
    };

    list.unshift(newClarification);
    await mobileStorage.setClarifications(list);
    return newClarification;
  }

  async answerClarification(clarificationId: string, answer: string, answeredBy: string): Promise<TenderClarification> {
    const list = await mobileStorage.getClarifications();
    const item = list.find((c) => c.id === clarificationId);
    if (!item) throw new Error('Clarification item not found.');

    item.answer = answer;
    item.answeredAt = new Date().toISOString();
    item.answeredBy = answeredBy;

    await mobileStorage.setClarifications(list);
    return item;
  }

  async getSavedTenders(vendorId: string = 'VN-01'): Promise<string[]> {
    const map = await mobileStorage.getSavedTenders();
    return map[vendorId] || [];
  }

  async toggleSavedTender(tenderId: string, vendorId: string = 'VN-01'): Promise<boolean> {
    const map = await mobileStorage.getSavedTenders();
    const mine = map[vendorId] || [];
    const isSaved = mine.includes(tenderId);
    const updated = isSaved ? mine.filter((id) => id !== tenderId) : [...mine, tenderId];
    map[vendorId] = updated;
    await mobileStorage.setSavedTenders(map);
    return !isSaved;
  }
}

export const tendersService = new TendersService();
