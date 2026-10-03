import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Lead,
  Client,
  FollowUp,
  Quote,
  Project,
  ProjectTeam,
  GovtLetter,
  FieldVisit,
  Task,
  Deliverable,
  Tender,
  SealedBid,
  TenderClarification,
  WorkOrder,
  Vendor,
  VendorApplication,
  DocumentItem,
  DispatchRecord,
  GovtDocument,
  ScanItem,
} from '../types';
import { crmService } from '../services';

import { mobileStorage } from '../storage';

interface CrmContextType {
  leads: Lead[];
  clients: Client[];
  followUps: FollowUp[];
  quotes: Quote[];
  projects: Project[];
  tenders: Tender[];
  workOrders: WorkOrder[];
  vendors: Vendor[];
  vendorApplications: VendorApplication[];
  clarifications: TenderClarification[];
  savedTenders: string[];
  documents: DocumentItem[];
  dispatches: DispatchRecord[];
  isLoading: boolean;
  refreshCrm: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<Lead>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<Lead>;
  updateLeadStage: (id: string, stage: Lead['stage'], extra?: Partial<Lead>) => Promise<Lead>;
  scheduleFollowUp: (data: Omit<FollowUp, 'id' | 'status'>) => Promise<FollowUp>;
  completeFollowUp: (id: string, outcome: string) => Promise<FollowUp>;
  rescheduleFollowUp: (id: string, newDate: string, newTime?: string) => Promise<FollowUp>;
  updateApprovalStep: (leadId: string, key: string, value: boolean) => Promise<Lead>;
  updateOnboardingStep: (leadId: string, key: string, value: boolean) => Promise<Lead>;
  convertLead: (id: string, gstin?: string, pan?: string) => Promise<{ client: Client; project: Project }>;
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNo' | 'status' | 'requiresDirectorApproval'>) => Promise<Quote>;
  approveQuote: (id: string, remarks?: string) => Promise<Quote>;
  saveLeadQuotation: (leadId: string, quoteData: any) => Promise<{ lead: Lead; quote: Quote }>;
  acceptQuotation: (leadId: string) => Promise<Lead>;
  rejectQuotation: (leadId: string, lostReason?: string) => Promise<Lead>;
  updateProjectStage: (id: string, stage: Project['currentStage']) => Promise<Project>;
  setProjectTeam: (projectId: string, patch: Partial<ProjectTeam>) => Promise<Project>;
  addTaskToProject: (projectId: string, task: Partial<Task>) => Promise<Task>;
  updateProjectTask: (projectId: string, taskIdOrKey: string, patch: Partial<Task>) => Promise<Project>;
  addProjectTask: (projectId: string, task: Partial<Task>) => Promise<Task>;
  addFieldVisit: (projectId: string, visit: Omit<FieldVisit, 'id'>) => Promise<Project>;
  submitToAuthority: (projectId: string, data: { date: string; mode: string; ackNo?: string; files?: any[] }) => Promise<Project>;
  setProjectApprovalStep: (projectId: string, stepKey: string, done: boolean) => Promise<Project>;
  setClosureStep: (projectId: string, key: string, done: boolean) => Promise<Project>;
  closeProject: (projectId: string, note?: string) => Promise<Project>;
  addProjectDocuments: (projectId: string, files: any[], category: string) => Promise<Project>;
  toggleDocumentSharing: (projectId: string, fileId: string) => Promise<Project>;
  addGovtLetter: (projectId: string, letter: Omit<GovtLetter, 'id'>) => Promise<GovtLetter>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  submitDeliverable: (projectId: string, deliv: Omit<any, 'id' | 'projectId' | 'submissionDate' | 'status'>) => Promise<any>;
  // Vendor Master & Registration
  addVendor: (data: Omit<Vendor, 'id'>) => Promise<Vendor>;
  updateVendor: (id: string, patch: Partial<Vendor>) => Promise<Vendor>;
  submitVendorApplication: (details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>, files?: any[]) => Promise<VendorApplication>;
  resubmitVendorApplication: (id: string, details: Partial<VendorApplication>, files?: any[]) => Promise<VendorApplication>;
  decideVendorApplication: (id: string, decision: 'approved' | 'rejected' | 'changes_requested', options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }) => Promise<{ application: VendorApplication; vendor?: Vendor }>;
  // Tenders & Bidding
  publishTender: (tenderData: Partial<Tender>, files?: any[]) => Promise<Tender>;
  closeBidding: (tenderId: string, actorName?: string) => Promise<Tender>;
  submitSealedBid: (tenderId: string, vendorId: string, vendorName: string, amount: number) => Promise<void>;
  submitBidWithDetails: (tenderId: string, bidData: any) => Promise<SealedBid>;
  withdrawBid: (tenderId: string, vendorId: string, actorName?: string) => Promise<void>;
  unsealTenderBids: (tenderId: string, dirKey: boolean, tmKey: boolean) => Promise<Tender>;
  decideBid: (tenderId: string, bidId: string, decision: 'shortlist' | 'reject', options?: any) => Promise<Tender>;
  allotTender: (tenderId: string, vendorId: string, vendorName: string, amount: number, projectTitle?: string, remarks?: string) => Promise<WorkOrder>;
  // Clarifications & Bookmarks
  askClarification: (tenderId: string, question: string, vendorId: string, vendorName: string) => Promise<TenderClarification>;
  answerClarification: (clarificationId: string, answer: string, answeredBy: string) => Promise<TenderClarification>;
  toggleSavedTender: (tenderId: string, vendorId?: string) => Promise<boolean>;
  // Subcontract Work Orders Lifecycle
  updateWorkOrderStage: (woId: string, stage: WorkOrder['currentStage']) => Promise<WorkOrder>;
  startWorkOrder: (woId: string, notes?: string, date?: string) => Promise<WorkOrder>;
  deliverWorkOrder: (woId: string, deliveryData: { notes: string; files?: any[]; date?: string }) => Promise<WorkOrder>;
  billWorkOrder: (woId: string, billData: { billNo: string; amount: number; tdsRate?: number; invoiceUrl?: string; date?: string; notes?: string }) => Promise<WorkOrder>;
  checkWorkOrderBill: (woId: string, decision: 'approved' | 'returned', options?: { note?: string; actorName?: string }) => Promise<WorkOrder>;
  payWorkOrder: (woId: string, paymentData: { utrRef: string; paymentMode?: string; tdsRate?: number; tdsSection?: string; date?: string; remarks?: string; actorName?: string }) => Promise<WorkOrder>;
  submitWorkOrderBill: (woId: string, billNo: string, amount: number, tdsRate?: number) => Promise<WorkOrder>;
  verifyAndPayWorkOrderBill: (woId: string, billId: string, utrRef: string) => Promise<WorkOrder>;
  // Documents & Dispatches
  govtDocuments: GovtDocument[];
  scanInbox: ScanItem[];
  refreshGovtDocuments: () => Promise<void>;
  verifyGovtDocument: (docId: string, options: { ok: boolean; reason?: string; note?: string }, verifierId?: string, verifierName?: string) => Promise<GovtDocument>;
  replaceDocScan: (docId: string, options: { fileName: string; scanId?: string }, uploaderName?: string) => Promise<GovtDocument>;
  linkGovtDocument: (docId: string, links: { leaseNo?: string; vendorId?: string }, actorName?: string) => Promise<GovtDocument>;
  authorizeGovtDocument: (docId: string, options: { client: boolean; vendor: boolean; original: boolean }, actorName?: string) => Promise<GovtDocument>;
  shareGovtDocument: (docId: string, how?: 'WhatsApp' | 'marked', actorName?: string) => Promise<GovtDocument>;
  requestGovtDocumentDispatch: (docId: string, needed: boolean, actorName?: string) => Promise<GovtDocument>;
  dispatchGovtDocument: (docId: string, details: { mode: string; docket: string; on: string }, actorName?: string) => Promise<GovtDocument>;
  receiveGovtDocument: (docId: string, details: { receivedBy: string; on: string }, actorName?: string) => Promise<GovtDocument>;
  addScans: (files: Array<{ name: string; size?: number; type?: string }>, scanner?: string) => Promise<ScanItem[]>;
  discardScan: (scanId: string) => Promise<void>;
  fileScanToProject: (scanId: string, projectId: string, letterData: any, filedBy?: string) => Promise<GovtDocument>;
  verifyDocument: (docId: string, verifierId: string, verifierName: string, remarks: string) => Promise<DocumentItem>;
  logDispatch: (data: Omit<DispatchRecord, 'id' | 'status'>) => Promise<DispatchRecord>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorApplications, setVendorApplications] = useState<VendorApplication[]>([]);
  const [clarifications, setClarifications] = useState<TenderClarification[]>([]);
  const [savedTenders, setSavedTenders] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [govtDocuments, setGovtDocuments] = useState<GovtDocument[]>([]);
  const [scanInbox, setScanInbox] = useState<ScanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [l, c, fu, q, p, t, wo, v, va, cl, st, doc, disp, gDoc, scans] = await Promise.all([
        crmService.getLeads(),
        mobileStorage.getClients(),
        mobileStorage.getFollowUps(),
        crmService.getQuotes(),
        crmService.getProjects(),
        crmService.getTenders(),
        crmService.getWorkOrders(),
        mobileStorage.getVendors(),
        mobileStorage.getVendorApplications(),
        mobileStorage.getClarifications(),
        crmService.getSavedTenders(),
        crmService.getDocuments(),
        crmService.getDispatches(),
        crmService.getGovtDocuments(),
        crmService.getScanInbox(),
      ]);
      setLeads(l);
      setClients(c);
      setFollowUps(fu);
      setQuotes(q);
      setProjects(p);
      setTenders(t);
      setWorkOrders(wo);
      setVendors(v);
      setVendorApplications(va);
      setClarifications(cl);
      setSavedTenders(st);
      setDocuments(doc);
      setDispatches(disp);
      setGovtDocuments(gDoc);
      setScanInbox(scans);
    } catch (e) {
      console.error('Error loading CRM data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const created = await crmService.addLead(leadData);
    await loadData();
    return created;
  };

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    const updated = await crmService.updateLead(id, patch);
    await loadData();
    return updated;
  };

  const updateLeadStage = async (id: string, stage: Lead['stage'], extra?: Partial<Lead>) => {
    const updated = await crmService.updateLeadStage(id, stage, extra);
    await loadData();
    return updated;
  };

  const scheduleFollowUp = async (data: Omit<FollowUp, 'id' | 'status'>) => {
    const fu = await crmService.scheduleFollowUp(data);
    await loadData();
    return fu;
  };

  const completeFollowUp = async (id: string, outcome: string) => {
    const fu = await crmService.completeFollowUp(id, outcome);
    await loadData();
    return fu;
  };

  const rescheduleFollowUp = async (id: string, newDate: string, newTime?: string) => {
    const fu = await crmService.rescheduleFollowUp(id, newDate, newTime);
    await loadData();
    return fu;
  };

  const updateApprovalStep = async (leadId: string, key: string, value: boolean) => {
    const lead = await crmService.updateApprovalStep(leadId, key, value);
    await loadData();
    return lead;
  };

  const updateOnboardingStep = async (leadId: string, key: string, value: boolean) => {
    const lead = await crmService.updateOnboardingStep(leadId, key, value);
    await loadData();
    return lead;
  };

  const convertLead = async (id: string, gstin?: string, pan?: string) => {
    const res = await crmService.convertLead(id, gstin, pan);
    await loadData();
    return res;
  };

  const addQuote = async (data: Omit<Quote, 'id' | 'quoteNo' | 'status' | 'requiresDirectorApproval'>) => {
    const q = await crmService.addQuote(data);
    await loadData();
    return q;
  };

  const approveQuote = async (id: string, remarks?: string) => {
    const q = await crmService.approveQuote(id, remarks);
    await loadData();
    return q;
  };

  const saveLeadQuotation = async (leadId: string, quoteData: any) => {
    const res = await crmService.saveLeadQuotation(leadId, quoteData);
    await loadData();
    return res;
  };

  const acceptQuotation = async (leadId: string) => {
    const res = await crmService.acceptQuotation(leadId);
    await loadData();
    return res;
  };

  const rejectQuotation = async (leadId: string, lostReason?: string) => {
    const res = await crmService.rejectQuotation(leadId, lostReason);
    await loadData();
    return res;
  };

  const updateProjectStage = async (id: string, stage: Project['currentStage']) => {
    const p = await crmService.updateProjectStage(id, stage);
    await loadData();
    return p;
  };

  const setProjectTeam = async (projectId: string, patch: Partial<ProjectTeam>) => {
    const p = await crmService.setProjectTeam(projectId, patch);
    await loadData();
    return p;
  };

  const addTaskToProject = async (projectId: string, task: Partial<Task>) => {
    const t = await crmService.addTaskToProject(projectId, task);
    await loadData();
    return t;
  };

  const updateProjectTask = async (projectId: string, taskIdOrKey: string, patch: Partial<Task>) => {
    const p = await crmService.updateProjectTask(projectId, taskIdOrKey, patch);
    await loadData();
    return p;
  };

  const addProjectTask = async (projectId: string, task: Partial<Task>) => {
    const t = await crmService.addTaskToProject(projectId, task);
    await loadData();
    return t;
  };

  const addFieldVisit = async (projectId: string, visit: Omit<FieldVisit, 'id'>) => {
    const p = await crmService.addFieldVisit(projectId, visit);
    await loadData();
    return p;
  };

  const submitToAuthority = async (projectId: string, data: { date: string; mode: string; ackNo?: string; files?: any[] }) => {
    const p = await crmService.submitToAuthority(projectId, data);
    await loadData();
    return p;
  };

  const setProjectApprovalStep = async (projectId: string, stepKey: string, done: boolean) => {
    const p = await crmService.setProjectApprovalStep(projectId, stepKey, done);
    await loadData();
    return p;
  };

  const setClosureStep = async (projectId: string, key: string, done: boolean) => {
    const p = await crmService.setClosureStep(projectId, key, done);
    await loadData();
    return p;
  };

  const closeProject = async (projectId: string, note?: string) => {
    const p = await crmService.closeProject(projectId, note);
    await loadData();
    return p;
  };

  const addProjectDocuments = async (projectId: string, files: any[], category: string) => {
    const p = await crmService.addProjectDocuments(projectId, files, category);
    await loadData();
    return p;
  };

  const toggleDocumentSharing = async (projectId: string, fileId: string) => {
    const p = await crmService.toggleDocumentSharing(projectId, fileId);
    await loadData();
    return p;
  };

  const addGovtLetter = async (projectId: string, letter: Omit<GovtLetter, 'id'>) => {
    const gl = await crmService.addGovtLetter(projectId, letter);
    await loadData();
    return gl;
  };

  const createProject = async (data: Partial<Project>) => {
    const p = await crmService.createProject(data);
    await loadData();
    return p;
  };

  const submitDeliverable = async (projectId: string, deliv: Omit<any, 'id' | 'projectId' | 'submissionDate' | 'status'>) => {
    const d = await crmService.submitDeliverable(projectId, deliv);
    await loadData();
    return d;
  };

  const addVendor = async (data: Omit<Vendor, 'id'>) => {
    const v = await crmService.addVendor(data);
    await loadData();
    return v;
  };

  const updateVendor = async (id: string, patch: Partial<Vendor>) => {
    const v = await crmService.updateVendor(id, patch);
    await loadData();
    return v;
  };

  const submitVendorApplication = async (details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>, files?: any[]) => {
    const a = await crmService.submitVendorApplication(details, files);
    await loadData();
    return a;
  };

  const resubmitVendorApplication = async (id: string, details: Partial<VendorApplication>, files?: any[]) => {
    const a = await crmService.resubmitVendorApplication(id, details, files);
    await loadData();
    return a;
  };

  const decideVendorApplication = async (
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }
  ) => {
    const res = await crmService.decideVendorApplication(id, decision, options);
    await loadData();
    return res;
  };

  const publishTender = async (tenderData: Partial<Tender>, files?: any[]) => {
    const t = await crmService.publishTender(tenderData, files);
    await loadData();
    return t;
  };

  const closeBidding = async (tenderId: string, actorName?: string) => {
    const t = await crmService.closeBidding(tenderId, actorName);
    await loadData();
    return t;
  };

  const submitSealedBid = async (tenderId: string, vendorId: string, vendorName: string, amount: number) => {
    await crmService.submitSealedBid(tenderId, vendorId, vendorName, amount);
    await loadData();
  };

  const submitBidWithDetails = async (tenderId: string, bidData: any) => {
    const b = await crmService.submitBidWithDetails(tenderId, bidData);
    await loadData();
    return b;
  };

  const withdrawBid = async (tenderId: string, vendorId: string, actorName?: string) => {
    await crmService.withdrawBid(tenderId, vendorId, actorName);
    await loadData();
  };

  const unsealTenderBids = async (tenderId: string, dirKey: boolean, tmKey: boolean) => {
    const t = await crmService.unsealTenderBids(tenderId, dirKey, tmKey);
    await loadData();
    return t;
  };

  const decideBid = async (tenderId: string, bidId: string, decision: 'shortlist' | 'reject', options?: any) => {
    const t = await crmService.decideBid(tenderId, bidId, decision, options);
    await loadData();
    return t;
  };

  const allotTender = async (tenderId: string, vendorId: string, vendorName: string, amount: number, projectTitle?: string, remarks?: string) => {
    const wo = await crmService.allotTender(tenderId, vendorId, vendorName, amount, projectTitle, remarks);
    await loadData();
    return wo;
  };

  const askClarification = async (tenderId: string, question: string, vendorId: string, vendorName: string) => {
    const c = await crmService.askClarification(tenderId, question, vendorId, vendorName);
    await loadData();
    return c;
  };

  const answerClarification = async (clarificationId: string, answer: string, answeredBy: string) => {
    const c = await crmService.answerClarification(clarificationId, answer, answeredBy);
    await loadData();
    return c;
  };

  const toggleSavedTender = async (tenderId: string, vendorId?: string) => {
    const res = await crmService.toggleSavedTender(tenderId, vendorId);
    await loadData();
    return res;
  };

  const updateWorkOrderStage = async (woId: string, stage: WorkOrder['currentStage']) => {
    const wo = await crmService.updateWorkOrderStage(woId, stage);
    await loadData();
    return wo;
  };

  const startWorkOrder = async (woId: string, notes?: string, date?: string) => {
    const wo = await crmService.startWorkOrder(woId, notes, date);
    await loadData();
    return wo;
  };

  const deliverWorkOrder = async (woId: string, deliveryData: { notes: string; files?: any[]; date?: string }) => {
    const wo = await crmService.deliverWorkOrder(woId, deliveryData);
    await loadData();
    return wo;
  };

  const billWorkOrder = async (woId: string, billData: { billNo: string; amount: number; tdsRate?: number; invoiceUrl?: string; date?: string; notes?: string }) => {
    const wo = await crmService.billWorkOrder(woId, billData);
    await loadData();
    return wo;
  };

  const checkWorkOrderBill = async (woId: string, decision: 'approved' | 'returned', options?: { note?: string; actorName?: string }) => {
    const wo = await crmService.checkWorkOrderBill(woId, decision, options);
    await loadData();
    return wo;
  };

  const payWorkOrder = async (woId: string, paymentData: { utrRef: string; paymentMode?: string; tdsRate?: number; tdsSection?: string; date?: string; remarks?: string; actorName?: string }) => {
    const wo = await crmService.payWorkOrder(woId, paymentData);
    await loadData();
    return wo;
  };

  const submitWorkOrderBill = async (woId: string, billNo: string, amount: number, tdsRate?: number) => {
    const wo = await crmService.submitWorkOrderBill(woId, billNo, amount, tdsRate);
    await loadData();
    return wo;
  };

  const verifyAndPayWorkOrderBill = async (woId: string, billId: string, utrRef: string) => {
    const wo = await crmService.verifyAndPayWorkOrderBill(woId, billId, utrRef);
    await loadData();
    return wo;
  };

  const refreshGovtDocuments = async () => {
    const [docs, scans, disps] = await Promise.all([
      crmService.getGovtDocuments(),
      crmService.getScanInbox(),
      crmService.getDispatches(),
    ]);
    setGovtDocuments(docs);
    setScanInbox(scans);
    setDispatches(disps);
  };

  const verifyGovtDocument = async (
    docId: string,
    options: { ok: boolean; reason?: string; note?: string },
    verifierId: string = 'emp-001',
    verifierName: string = 'Kritika Gupta'
  ) => {
    const res = await crmService.verifyGovtDocument(docId, options, verifierId, verifierName);
    await refreshGovtDocuments();
    return res;
  };

  const replaceDocScan = async (
    docId: string,
    options: { fileName: string; scanId?: string },
    uploaderName: string = 'A. Singh'
  ) => {
    const res = await crmService.replaceDocScan(docId, options, uploaderName);
    await refreshGovtDocuments();
    return res;
  };

  const linkGovtDocument = async (
    docId: string,
    links: { leaseNo?: string; vendorId?: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.linkGovtDocument(docId, links, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const authorizeGovtDocument = async (
    docId: string,
    options: { client: boolean; vendor: boolean; original: boolean },
    actorName: string = 'Kritika Gupta'
  ) => {
    const res = await crmService.authorizeGovtDocument(docId, options, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const shareGovtDocument = async (
    docId: string,
    how: 'WhatsApp' | 'marked' = 'WhatsApp',
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.shareGovtDocument(docId, how, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const requestGovtDocumentDispatch = async (
    docId: string,
    needed: boolean,
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.requestGovtDocumentDispatch(docId, needed, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const dispatchGovtDocument = async (
    docId: string,
    details: { mode: string; docket: string; on: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.dispatchGovtDocument(docId, details, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const receiveGovtDocument = async (
    docId: string,
    details: { receivedBy: string; on: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.receiveGovtDocument(docId, details, actorName);
    await refreshGovtDocuments();
    return res;
  };

  const addScans = async (
    files: Array<{ name: string; size?: number; type?: string }>,
    scanner: string = 'Uploaded'
  ) => {
    const res = await crmService.addScans(files, scanner);
    await refreshGovtDocuments();
    return res;
  };

  const discardScan = async (scanId: string) => {
    await crmService.discardScan(scanId);
    await refreshGovtDocuments();
  };

  const fileScanToProject = async (
    scanId: string,
    projectId: string,
    letterData: any,
    filedBy: string = 'A. Singh'
  ) => {
    const res = await crmService.fileScanToProject(scanId, projectId, letterData, filedBy);
    await refreshGovtDocuments();
    return res;
  };

  const verifyDocument = async (docId: string, verifierId: string, verifierName: string, remarks: string) => {
    const doc = await crmService.verifyDocument(docId, verifierId, verifierName, remarks);
    await loadData();
    return doc;
  };

  const logDispatch = async (data: Omit<DispatchRecord, 'id' | 'status'>) => {
    const disp = await crmService.logDispatch(data);
    await loadData();
    return disp;
  };

  return (
    <CrmContext.Provider
      value={{
        leads,
        clients,
        followUps,
        quotes,
        projects,
        tenders,
        workOrders,
        vendors,
        vendorApplications,
        clarifications,
        savedTenders,
        documents,
        dispatches,
        govtDocuments,
        scanInbox,
        isLoading,
        refreshCrm: loadData,
        refreshGovtDocuments,
        verifyGovtDocument,
        replaceDocScan,
        linkGovtDocument,
        authorizeGovtDocument,
        shareGovtDocument,
        requestGovtDocumentDispatch,
        dispatchGovtDocument,
        receiveGovtDocument,
        addScans,
        discardScan,
        fileScanToProject,
        addLead,
        updateLead,
        updateLeadStage,
        scheduleFollowUp,
        completeFollowUp,
        rescheduleFollowUp,
        updateApprovalStep,
        updateOnboardingStep,
        convertLead,
        addQuote,
        approveQuote,
        saveLeadQuotation,
        acceptQuotation,
        rejectQuotation,
        updateProjectStage,
        setProjectTeam,
        addTaskToProject,
        updateProjectTask,
        addProjectTask,
        addFieldVisit,
        submitToAuthority,
        setProjectApprovalStep,
        setClosureStep,
        closeProject,
        addProjectDocuments,
        toggleDocumentSharing,
        addGovtLetter,
        createProject,
        submitDeliverable,
        addVendor,
        updateVendor,
        submitVendorApplication,
        resubmitVendorApplication,
        decideVendorApplication,
        publishTender,
        closeBidding,
        submitSealedBid,
        submitBidWithDetails,
        withdrawBid,
        unsealTenderBids,
        decideBid,
        allotTender,
        askClarification,
        answerClarification,
        toggleSavedTender,
        updateWorkOrderStage,
        startWorkOrder,
        deliverWorkOrder,
        billWorkOrder,
        checkWorkOrderBill,
        payWorkOrder,
        submitWorkOrderBill,
        verifyAndPayWorkOrderBill,
        verifyDocument,
        logDispatch,
      }}
    >
      {children}
    </CrmContext.Provider>

  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
