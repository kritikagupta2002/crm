import { mobileStorage } from '../../storage';
import { Quote, Lead } from '../../types';
import { QUOTATION_RULES } from '../../constants';

export class QuotesService {
  async getQuotes(): Promise<Quote[]> {
    return mobileStorage.getQuotes();
  }

  async addQuote(data: Omit<Quote, 'id' | 'quoteNo' | 'status' | 'requiresDirectorApproval'>): Promise<Quote> {
    const quotes = await mobileStorage.getQuotes();
    const total = data.total;
    const discount = data.discount;
    const subtotal = data.subtotal;
    const discountPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    const requiresDirector =
      total > QUOTATION_RULES.directorApprovalAmountThreshold ||
      discountPct > QUOTATION_RULES.directorApprovalDiscountThreshold;

    const newQuote: Quote = {
      ...data,
      id: 'q-' + Date.now(),
      quoteNo: 'QT-BGSPL-2026-' + (quotes.length + 1).toString().padStart(3, '0'),
      status: requiresDirector ? 'Pending Approval' : 'Approved',
      requiresDirectorApproval: requiresDirector,
    };

    quotes.unshift(newQuote);
    await mobileStorage.setQuotes(quotes);
    return newQuote;
  }

  async saveLeadQuotation(leadId: string, quoteData: any): Promise<{ lead: Lead; quote: Quote }> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found.');

    const version = (lead.quote?.version || 0) + 1;
    const isRevision = version > 1;
    const quoteStatus = isRevision ? 'Revised' : 'Sent';

    lead.quote = {
      ...quoteData,
      version,
      sentOn: new Date().toISOString().split('T')[0],
      status: quoteStatus,
    };
    lead.quoteValue = quoteData.total;
    lead.quoteStatus = quoteStatus;
    lead.stage = 'Proposal Sent';

    await mobileStorage.setLeads(leads);

    const quotes = await mobileStorage.getQuotes();
    const existingIdx = quotes.findIndex((q) => q.leadId === leadId || q.clientName === lead.company);
    const requiresDirector =
      quoteData.total > QUOTATION_RULES.directorApprovalAmountThreshold ||
      (quoteData.discountPct || 0) > QUOTATION_RULES.directorApprovalDiscountThreshold;

    const quoteRecord: Quote = {
      id: 'q-' + Date.now(),
      quoteNo: `QT-${lead.id.replace('BG-', '')}${version > 1 ? `-R${version - 1}` : ''}`,
      clientId: lead.id,
      clientName: lead.company,
      projectTitle: lead.serviceDetail || lead.title,
      date: new Date().toISOString().split('T')[0],
      lineItems: quoteData.items.map((it: any, idx: number) => ({
        id: `li-${idx + 1}`,
        description: it.description,
        unit: 'Units',
        quantity: it.qty,
        rate: it.rate,
        amount: it.qty * it.rate,
      })),
      subtotal: quoteData.gross || quoteData.subtotal,
      discount: quoteData.discount || 0,
      gstRate: 0.18,
      gstAmount: quoteData.gst || 0,
      total: quoteData.total,
      status: requiresDirector ? 'Pending Approval' : (quoteStatus as any),
      requiresDirectorApproval: requiresDirector,
      validUntil: quoteData.validUntil,
      leadId: lead.id,
    };

    if (existingIdx >= 0) {
      quotes[existingIdx] = quoteRecord;
    } else {
      quotes.unshift(quoteRecord);
    }
    await mobileStorage.setQuotes(quotes);

    return { lead, quote: quoteRecord };
  }

  async acceptQuotation(leadId: string): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found.');

    lead.quoteStatus = 'Accepted';
    lead.approval = {
      quoteAccepted: true,
      poReceived: lead.approval?.poReceived || false,
      advanceReceived: lead.approval?.advanceReceived || false,
      agreementSigned: lead.approval?.agreementSigned || false,
    };

    if (lead.quote) {
      lead.quote.status = 'Accepted';
    }

    await mobileStorage.setLeads(leads);

    const quotes = await mobileStorage.getQuotes();
    const q = quotes.find((x) => x.leadId === leadId || x.clientName === lead.company);
    if (q) {
      q.status = 'Accepted';
      await mobileStorage.setQuotes(quotes);
    }

    return lead;
  }

  async rejectQuotation(leadId: string, lostReason?: string): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found.');

    lead.quoteStatus = 'Rejected';
    lead.stage = 'Lost';
    if (lostReason) lead.lostReason = lostReason;
    if (lead.quote) {
      lead.quote.status = 'Rejected';
    }

    await mobileStorage.setLeads(leads);

    const quotes = await mobileStorage.getQuotes();
    const q = quotes.find((x) => x.leadId === leadId || x.clientName === lead.company);
    if (q) {
      q.status = 'Rejected';
      await mobileStorage.setQuotes(quotes);
    }

    return lead;
  }

  async approveQuote(id: string, remarks?: string): Promise<Quote> {
    const quotes = await mobileStorage.getQuotes();
    const target = quotes.find((q) => q.id === id);
    if (!target) throw new Error('Quotation not found.');
    target.status = 'Approved';
    target.approvalRemarks = remarks || 'Approved by Director';
    await mobileStorage.setQuotes(quotes);
    return target;
  }
}

export const quotesService = new QuotesService();
