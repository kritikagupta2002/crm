import {
  Lead,
  Client,
  FollowUp,
  Quote,
  Project,
  ProjectStageNumber,
  ProjectTeam,
  GovtLetter,
  FieldVisit,
  Tender,
  SealedBid,
  TenderClarification,
  WorkOrder,
  Vendor,
  VendorApplication,
  DocumentItem,
  DispatchRecord,
  Task,
  Deliverable,
  GovtDocument,
  ScanItem,
} from '../types';

import {
  leadsService,
  followupsService,
  quotesService,
  projectsService,
  vendorsService,
  tendersService,
  workOrdersService,
  documentsService,
  govtDocumentsService,
  scanInboxService,
  dispatchService,
} from './crm';

export * from './crm';

/**
 * Backward-compatible facade for CRM domain services.
 * Delegates all operations to focused domain services.
 */
export class CrmService {
  // --- Leads Domain (1-4, 9-11) ---
  async getLeads(): Promise<Lead[]> {
    return leadsService.getLeads();
  }

  async addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    return leadsService.addLead(lead);
  }

  async updateLeadStage(id: string, stage: Lead['stage'], extra?: Partial<Lead>): Promise<Lead> {
    return leadsService.updateLeadStage(id, stage, extra);
  }

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    return leadsService.updateLead(id, patch);
  }

  async updateApprovalStep(leadId: string, key: string, value: boolean): Promise<Lead> {
    return leadsService.updateApprovalStep(leadId, key, value);
  }

  async updateOnboardingStep(leadId: string, key: string, value: boolean): Promise<Lead> {
    return leadsService.updateOnboardingStep(leadId, key, value);
  }

  async convertLead(id: string, gstin?: string, pan?: string): Promise<{ client: Client; project: Project }> {
    return leadsService.convertLead(id, gstin, pan);
  }

  // --- Follow-ups Domain (5-8) ---
  async getFollowUps(): Promise<FollowUp[]> {
    return followupsService.getFollowUps();
  }

  async scheduleFollowUp(data: Omit<FollowUp, 'id' | 'status'>): Promise<FollowUp> {
    return followupsService.scheduleFollowUp(data);
  }

  async completeFollowUp(id: string, outcome: string): Promise<FollowUp> {
    return followupsService.completeFollowUp(id, outcome);
  }

  async rescheduleFollowUp(id: string, newDate: string, newTime?: string): Promise<FollowUp> {
    return followupsService.rescheduleFollowUp(id, newDate, newTime);
  }

  // --- Quotes Domain (12-17) ---
  async getQuotes(): Promise<Quote[]> {
    return quotesService.getQuotes();
  }

  async addQuote(data: Omit<Quote, 'id' | 'quoteNo' | 'status' | 'requiresDirectorApproval'>): Promise<Quote> {
    return quotesService.addQuote(data);
  }

  async saveLeadQuotation(leadId: string, quoteData: any): Promise<{ lead: Lead; quote: Quote }> {
    return quotesService.saveLeadQuotation(leadId, quoteData);
  }

  async acceptQuotation(leadId: string): Promise<Lead> {
    return quotesService.acceptQuotation(leadId);
  }

  async rejectQuotation(leadId: string, lostReason?: string): Promise<Lead> {
    return quotesService.rejectQuotation(leadId, lostReason);
  }

  async approveQuote(id: string, remarks?: string): Promise<Quote> {
    return quotesService.approveQuote(id, remarks);
  }

  // --- Projects Domain (18-32) ---
  async getProjects(): Promise<Project[]> {
    return projectsService.getProjects();
  }

  async updateProjectStage(id: string, nextStage: ProjectStageNumber): Promise<Project> {
    return projectsService.updateProjectStage(id, nextStage);
  }

  async setProjectTeam(projectId: string, patch: Partial<ProjectTeam>): Promise<Project> {
    return projectsService.setProjectTeam(projectId, patch);
  }

  async addTaskToProject(projectId: string, task: Partial<Task>): Promise<Task> {
    return projectsService.addTaskToProject(projectId, task);
  }

  async updateProjectTask(projectId: string, taskIdOrKey: string, patch: Partial<Task>): Promise<Project> {
    return projectsService.updateProjectTask(projectId, taskIdOrKey, patch);
  }

  async addFieldVisit(projectId: string, visit: Omit<FieldVisit, 'id'>): Promise<Project> {
    return projectsService.addFieldVisit(projectId, visit);
  }

  async submitToAuthority(projectId: string, data: { date: string; mode: string; ackNo?: string; files?: any[] }): Promise<Project> {
    return projectsService.submitToAuthority(projectId, data);
  }

  async setProjectApprovalStep(projectId: string, stepKey: string, done: boolean): Promise<Project> {
    return projectsService.setProjectApprovalStep(projectId, stepKey, done);
  }

  async setClosureStep(projectId: string, key: string, done: boolean): Promise<Project> {
    return projectsService.setClosureStep(projectId, key, done);
  }

  async closeProject(projectId: string, note?: string): Promise<Project> {
    return projectsService.closeProject(projectId, note);
  }

  async addProjectDocuments(projectId: string, files: any[], category: string): Promise<Project> {
    return projectsService.addProjectDocuments(projectId, files, category);
  }

  async toggleDocumentSharing(projectId: string, fileId: string): Promise<Project> {
    return projectsService.toggleDocumentSharing(projectId, fileId);
  }

  async addGovtLetter(projectId: string, letter: Omit<GovtLetter, 'id'>): Promise<GovtLetter> {
    return projectsService.addGovtLetter(projectId, letter);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return projectsService.createProject(data);
  }

  async submitDeliverable(projectId: string, deliv: Omit<Deliverable, 'id' | 'projectId' | 'submissionDate' | 'status'>): Promise<Deliverable> {
    return projectsService.submitDeliverable(projectId, deliv);
  }

  async approveDeliverable(projectId: string, deliverableId: string, remarks?: string): Promise<{ project: Project; deliverable: Deliverable }> {
    return projectsService.approveDeliverable(projectId, deliverableId, remarks);
  }

  async rejectDeliverable(projectId: string, deliverableId: string, reason: string): Promise<{ project: Project; deliverable: Deliverable }> {
    return projectsService.rejectDeliverable(projectId, deliverableId, reason);
  }

  // --- Vendors Domain (33-40) ---
  async getVendors(): Promise<Vendor[]> {
    return vendorsService.getVendors();
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    return vendorsService.getVendorById(id);
  }

  async addVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
    return vendorsService.addVendor(data);
  }

  async updateVendor(id: string, patch: Partial<Vendor>): Promise<Vendor> {
    return vendorsService.updateVendor(id, patch);
  }

  async getVendorApplications(): Promise<VendorApplication[]> {
    return vendorsService.getVendorApplications();
  }

  async submitVendorApplication(
    details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>,
    files?: any[]
  ): Promise<VendorApplication> {
    return vendorsService.submitVendorApplication(details, files);
  }

  async resubmitVendorApplication(id: string, details: Partial<VendorApplication>, files?: any[]): Promise<VendorApplication> {
    return vendorsService.resubmitVendorApplication(id, details, files);
  }

  async decideVendorApplication(
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }
  ): Promise<{ application: VendorApplication; vendor?: Vendor }> {
    return vendorsService.decideVendorApplication(id, decision, options);
  }

  // --- Tenders Domain (41-55) ---
  async getTenders(): Promise<Tender[]> {
    return tendersService.getTenders();
  }

  async getTenderById(id: string): Promise<Tender | undefined> {
    return tendersService.getTenderById(id);
  }

  async publishTender(tenderData: Partial<Tender>, files?: any[]): Promise<Tender> {
    return tendersService.publishTender(tenderData, files);
  }

  async closeBidding(tenderId: string, actorName?: string): Promise<Tender> {
    return tendersService.closeBidding(tenderId, actorName);
  }

  async submitSealedBid(tenderId: string, vendorId: string, vendorName: string, bidAmount: number): Promise<void> {
    return tendersService.submitSealedBid(tenderId, vendorId, vendorName, bidAmount);
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
    return tendersService.submitBidWithDetails(tenderId, bidData);
  }

  async withdrawBid(tenderId: string, vendorId: string, actorName?: string): Promise<void> {
    return tendersService.withdrawBid(tenderId, vendorId, actorName);
  }

  async unsealTenderBids(tenderId: string, directorKeyConfirmed: boolean, tenderManagerKeyConfirmed: boolean): Promise<Tender> {
    return tendersService.unsealTenderBids(tenderId, directorKeyConfirmed, tenderManagerKeyConfirmed);
  }

  async decideBid(
    tenderId: string,
    bidId: string,
    decision: 'shortlist' | 'reject',
    options?: { reason?: string; note?: string; actorName?: string }
  ): Promise<Tender> {
    return tendersService.decideBid(tenderId, bidId, decision, options);
  }

  async allotTender(
    tenderId: string,
    vendorId: string,
    vendorName: string,
    contractAmount: number,
    projectTitle?: string,
    remarks?: string
  ): Promise<WorkOrder> {
    return tendersService.allotTender(tenderId, vendorId, vendorName, contractAmount, projectTitle, remarks);
  }

  async getClarifications(tenderId?: string): Promise<TenderClarification[]> {
    return tendersService.getClarifications(tenderId);
  }

  async askClarification(tenderId: string, question: string, vendorId: string, vendorName: string): Promise<TenderClarification> {
    return tendersService.askClarification(tenderId, question, vendorId, vendorName);
  }

  async answerClarification(clarificationId: string, answer: string, answeredBy: string): Promise<TenderClarification> {
    return tendersService.answerClarification(clarificationId, answer, answeredBy);
  }

  async getSavedTenders(vendorId: string = 'VN-01'): Promise<string[]> {
    return tendersService.getSavedTenders(vendorId);
  }

  async toggleSavedTender(tenderId: string, vendorId: string = 'VN-01'): Promise<boolean> {
    return tendersService.toggleSavedTender(tenderId, vendorId);
  }

  // --- Work Orders Domain (56-65) ---
  async getWorkOrders(): Promise<WorkOrder[]> {
    return workOrdersService.getWorkOrders();
  }

  async getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
    return workOrdersService.getWorkOrderById(id);
  }

  async updateWorkOrderStage(woId: string, stage: WorkOrder['currentStage']): Promise<WorkOrder> {
    return workOrdersService.updateWorkOrderStage(woId, stage);
  }

  async startWorkOrder(woId: string, notes?: string, date?: string): Promise<WorkOrder> {
    return workOrdersService.startWorkOrder(woId, notes, date);
  }

  async deliverWorkOrder(woId: string, deliveryData: { notes: string; files?: any[]; date?: string }): Promise<WorkOrder> {
    return workOrdersService.deliverWorkOrder(woId, deliveryData);
  }

  async submitWorkOrderBill(woId: string, billNo: string, amount: number, tdsRate: number = 0.02): Promise<WorkOrder> {
    return workOrdersService.submitWorkOrderBill(woId, billNo, amount, tdsRate);
  }

  async billWorkOrder(
    woId: string,
    billData: {
      billNo: string;
      amount: number;
      tdsRate?: number;
      invoiceUrl?: string;
      date?: string;
      notes?: string;
    }
  ): Promise<WorkOrder> {
    return workOrdersService.billWorkOrder(woId, billData);
  }

  async checkWorkOrderBill(
    woId: string,
    decision: 'approved' | 'returned',
    options?: { note?: string; actorName?: string }
  ): Promise<WorkOrder> {
    return workOrdersService.checkWorkOrderBill(woId, decision, options);
  }

  async verifyAndPayWorkOrderBill(woId: string, billId: string, utrRef: string): Promise<WorkOrder> {
    return workOrdersService.verifyAndPayWorkOrderBill(woId, billId, utrRef);
  }

  async payWorkOrder(
    woId: string,
    paymentData: {
      utrRef: string;
      paymentMode?: string;
      tdsRate?: number;
      tdsSection?: string;
      date?: string;
      remarks?: string;
      actorName?: string;
    }
  ): Promise<WorkOrder> {
    return workOrdersService.payWorkOrder(woId, paymentData);
  }

  // --- Documents Domain (66-67) ---
  async getDocuments(): Promise<DocumentItem[]> {
    return documentsService.getDocuments();
  }

  async verifyDocument(docId: string, verifierId: string, verifierName: string, remarks: string): Promise<DocumentItem> {
    return documentsService.verifyDocument(docId, verifierId, verifierName, remarks);
  }

  // --- Government Documents / EDMS Domain (68-76) ---
  async getGovtDocuments(): Promise<GovtDocument[]> {
    return govtDocumentsService.getGovtDocuments();
  }

  async verifyGovtDocument(
    docId: string,
    options: { ok: boolean; reason?: string; note?: string },
    verifierId: string,
    verifierName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.verifyGovtDocument(docId, options, verifierId, verifierName);
  }

  async replaceDocScan(
    docId: string,
    options: { fileName: string; scanId?: string },
    uploaderName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.replaceDocScan(docId, options, uploaderName);
  }

  async linkGovtDocument(
    docId: string,
    links: { leaseNo?: string; vendorId?: string },
    actorName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.linkGovtDocument(docId, links, actorName);
  }

  async authorizeGovtDocument(
    docId: string,
    options: { client: boolean; vendor: boolean; original: boolean },
    actorName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.authorizeGovtDocument(docId, options, actorName);
  }

  async shareGovtDocument(
    docId: string,
    how: 'WhatsApp' | 'marked' = 'WhatsApp',
    actorName: string = 'A. Singh'
  ): Promise<GovtDocument> {
    return govtDocumentsService.shareGovtDocument(docId, how, actorName);
  }

  async requestGovtDocumentDispatch(
    docId: string,
    needed: boolean,
    actorName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.requestGovtDocumentDispatch(docId, needed, actorName);
  }

  async dispatchGovtDocument(
    docId: string,
    details: { mode: string; docket: string; on: string },
    actorName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.dispatchGovtDocument(docId, details, actorName);
  }

  async receiveGovtDocument(
    docId: string,
    details: { receivedBy: string; on: string },
    actorName: string
  ): Promise<GovtDocument> {
    return govtDocumentsService.receiveGovtDocument(docId, details, actorName);
  }

  // --- Scan Inbox Domain (77-80) ---
  async getScanInbox(): Promise<ScanItem[]> {
    return scanInboxService.getScanInbox();
  }

  async addScans(
    files: Array<{ name: string; size?: number; type?: string }>,
    scanner: string = 'Uploaded'
  ): Promise<ScanItem[]> {
    return scanInboxService.addScans(files, scanner);
  }

  async discardScan(scanId: string): Promise<void> {
    return scanInboxService.discardScan(scanId);
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
    return scanInboxService.fileScanToProject(scanId, projectId, letterData, filedBy);
  }

  // --- Dispatches Domain (81-82) ---
  async getDispatches(): Promise<DispatchRecord[]> {
    return dispatchService.getDispatches();
  }

  async logDispatch(data: Omit<DispatchRecord, 'id' | 'status'>): Promise<DispatchRecord> {
    return dispatchService.logDispatch(data);
  }
}

export const crmService = new CrmService();
