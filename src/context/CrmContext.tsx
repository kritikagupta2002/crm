import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
  refreshLeads?: () => Promise<void>;
  refreshClients?: () => Promise<void>;
  refreshFollowUps?: () => Promise<void>;
  refreshQuotes?: () => Promise<void>;
  refreshProjects?: () => Promise<void>;
  refreshTenders?: () => Promise<void>;
  refreshWorkOrders?: () => Promise<void>;
  refreshVendors?: () => Promise<void>;
  refreshVendorApplications?: () => Promise<void>;
  refreshClarifications?: () => Promise<void>;
  refreshSavedTenders?: () => Promise<void>;
  refreshDocuments?: () => Promise<void>;
  refreshDispatches?: () => Promise<void>;
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
  addVendor: (data: Omit<Vendor, 'id'>) => Promise<Vendor>;
  updateVendor: (id: string, patch: Partial<Vendor>) => Promise<Vendor>;
  submitVendorApplication: (details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>, files?: any[]) => Promise<VendorApplication>;
  resubmitVendorApplication: (id: string, details: Partial<VendorApplication>, files?: any[]) => Promise<VendorApplication>;
  decideVendorApplication: (id: string, decision: 'approved' | 'rejected' | 'changes_requested', options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }) => Promise<{ application: VendorApplication; vendor?: Vendor }>;
  publishTender: (tenderData: Partial<Tender>, files?: any[]) => Promise<Tender>;
  closeBidding: (tenderId: string, actorName?: string) => Promise<Tender>;
  submitSealedBid: (tenderId: string, vendorId: string, vendorName: string, amount: number) => Promise<void>;
  submitBidWithDetails: (tenderId: string, bidData: any) => Promise<SealedBid>;
  withdrawBid: (tenderId: string, vendorId: string, actorName?: string) => Promise<void>;
  unsealTenderBids: (tenderId: string, dirKey: boolean, tmKey: boolean) => Promise<Tender>;
  decideBid: (tenderId: string, bidId: string, decision: 'shortlist' | 'reject', options?: any) => Promise<Tender>;
  allotTender: (tenderId: string, vendorId: string, vendorName: string, amount: number, projectTitle?: string, remarks?: string) => Promise<WorkOrder>;
  askClarification: (tenderId: string, question: string, vendorId: string, vendorName: string) => Promise<TenderClarification>;
  answerClarification: (clarificationId: string, answer: string, answeredBy: string) => Promise<TenderClarification>;
  toggleSavedTender: (tenderId: string, vendorId?: string) => Promise<boolean>;
  updateWorkOrderStage: (woId: string, stage: WorkOrder['currentStage']) => Promise<WorkOrder>;
  startWorkOrder: (woId: string, notes?: string, date?: string) => Promise<WorkOrder>;
  deliverWorkOrder: (woId: string, deliveryData: { notes: string; files?: any[]; date?: string }) => Promise<WorkOrder>;
  billWorkOrder: (woId: string, billData: { billNo: string; amount: number; tdsRate?: number; invoiceUrl?: string; date?: string; notes?: string }) => Promise<WorkOrder>;
  checkWorkOrderBill: (woId: string, decision: 'approved' | 'returned', options?: { note?: string; actorName?: string }) => Promise<WorkOrder>;
  payWorkOrder: (woId: string, paymentData: { utrRef: string; paymentMode?: string; tdsRate?: number; tdsSection?: string; date?: string; remarks?: string; actorName?: string }) => Promise<WorkOrder>;
  submitWorkOrderBill: (woId: string, billNo: string, amount: number, tdsRate?: number) => Promise<WorkOrder>;
  verifyAndPayWorkOrderBill: (woId: string, billId: string, utrRef: string) => Promise<WorkOrder>;
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

  const refreshLeads = useCallback(async () => {
    try {
      const l = await crmService.getLeads();
      setLeads(l);
    } catch (e) {
      console.error('Error refreshing leads:', e);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    try {
      const c = await mobileStorage.getClients();
      setClients(c);
    } catch (e) {
      console.error('Error refreshing clients:', e);
    }
  }, []);

  const refreshFollowUps = useCallback(async () => {
    try {
      const fu = await mobileStorage.getFollowUps();
      setFollowUps(fu);
    } catch (e) {
      console.error('Error refreshing follow-ups:', e);
    }
  }, []);

  const refreshQuotes = useCallback(async () => {
    try {
      const q = await crmService.getQuotes();
      setQuotes(q);
    } catch (e) {
      console.error('Error refreshing quotes:', e);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const p = await crmService.getProjects();
      setProjects(p);
    } catch (e) {
      console.error('Error refreshing projects:', e);
    }
  }, []);

  const refreshTenders = useCallback(async () => {
    try {
      const t = await crmService.getTenders();
      setTenders(t);
    } catch (e) {
      console.error('Error refreshing tenders:', e);
    }
  }, []);

  const refreshWorkOrders = useCallback(async () => {
    try {
      const wo = await crmService.getWorkOrders();
      setWorkOrders(wo);
    } catch (e) {
      console.error('Error refreshing work orders:', e);
    }
  }, []);

  const refreshVendors = useCallback(async () => {
    try {
      const v = await mobileStorage.getVendors();
      setVendors(v);
    } catch (e) {
      console.error('Error refreshing vendors:', e);
    }
  }, []);

  const refreshVendorApplications = useCallback(async () => {
    try {
      const va = await mobileStorage.getVendorApplications();
      setVendorApplications(va);
    } catch (e) {
      console.error('Error refreshing vendor applications:', e);
    }
  }, []);

  const refreshClarifications = useCallback(async () => {
    try {
      const cl = await mobileStorage.getClarifications();
      setClarifications(cl);
    } catch (e) {
      console.error('Error refreshing clarifications:', e);
    }
  }, []);

  const refreshSavedTenders = useCallback(async () => {
    try {
      const st = await crmService.getSavedTenders();
      setSavedTenders(st);
    } catch (e) {
      console.error('Error refreshing saved tenders:', e);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      const doc = await crmService.getDocuments();
      setDocuments(doc);
    } catch (e) {
      console.error('Error refreshing documents:', e);
    }
  }, []);

  const refreshDispatches = useCallback(async () => {
    try {
      const disp = await crmService.getDispatches();
      setDispatches(disp);
    } catch (e) {
      console.error('Error refreshing dispatches:', e);
    }
  }, []);

  const refreshGovtDocuments = useCallback(async () => {
    try {
      const [docs, scans, disps] = await Promise.all([
        crmService.getGovtDocuments(),
        crmService.getScanInbox(),
        crmService.getDispatches(),
      ]);
      setGovtDocuments(docs);
      setScanInbox(scans);
      setDispatches(disps);
    } catch (e) {
      console.error('Failed to refresh govt documents:', e);
    }
  }, []);

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const created = await crmService.addLead(leadData);
    await refreshLeads();
    return created;
  }, [refreshLeads]);

  const updateLead = useCallback(async (id: string, patch: Partial<Lead>) => {
    const updated = await crmService.updateLead(id, patch);
    await refreshLeads();
    return updated;
  }, [refreshLeads]);

  const updateLeadStage = useCallback(async (id: string, stage: Lead['stage'], extra?: Partial<Lead>) => {
    const updated = await crmService.updateLeadStage(id, stage, extra);
    await refreshLeads();
    return updated;
  }, [refreshLeads]);

  const scheduleFollowUp = useCallback(async (data: Omit<FollowUp, 'id' | 'status'>) => {
    const fu = await crmService.scheduleFollowUp(data);
    await refreshFollowUps();
    return fu;
  }, [refreshFollowUps]);

  const completeFollowUp = useCallback(async (id: string, outcome: string) => {
    const fu = await crmService.completeFollowUp(id, outcome);
    await refreshFollowUps();
    return fu;
  }, [refreshFollowUps]);

  const rescheduleFollowUp = useCallback(async (id: string, newDate: string, newTime?: string) => {
    const fu = await crmService.rescheduleFollowUp(id, newDate, newTime);
    await refreshFollowUps();
    return fu;
  }, [refreshFollowUps]);

  const updateApprovalStep = useCallback(async (leadId: string, key: string, value: boolean) => {
    const lead = await crmService.updateApprovalStep(leadId, key, value);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const updateOnboardingStep = useCallback(async (leadId: string, key: string, value: boolean) => {
    const lead = await crmService.updateOnboardingStep(leadId, key, value);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const convertLead = useCallback(async (id: string, gstin?: string, pan?: string) => {
    const res = await crmService.convertLead(id, gstin, pan);
    await Promise.all([refreshLeads(), refreshClients(), refreshProjects()]);
    return res;
  }, [refreshLeads, refreshClients, refreshProjects]);

  const addQuote = useCallback(async (data: Omit<Quote, 'id' | 'quoteNo' | 'status' | 'requiresDirectorApproval'>) => {
    const q = await crmService.addQuote(data);
    await refreshQuotes();
    return q;
  }, [refreshQuotes]);

  const approveQuote = useCallback(async (id: string, remarks?: string) => {
    const q = await crmService.approveQuote(id, remarks);
    await refreshQuotes();
    return q;
  }, [refreshQuotes]);

  const saveLeadQuotation = useCallback(async (leadId: string, quoteData: any) => {
    const res = await crmService.saveLeadQuotation(leadId, quoteData);
    await Promise.all([refreshQuotes(), refreshLeads()]);
    return res;
  }, [refreshQuotes, refreshLeads]);

  const acceptQuotation = useCallback(async (leadId: string) => {
    const res = await crmService.acceptQuotation(leadId);
    await Promise.all([refreshQuotes(), refreshLeads()]);
    return res;
  }, [refreshQuotes, refreshLeads]);

  const rejectQuotation = useCallback(async (leadId: string, lostReason?: string) => {
    const res = await crmService.rejectQuotation(leadId, lostReason);
    await Promise.all([refreshQuotes(), refreshLeads()]);
    return res;
  }, [refreshQuotes, refreshLeads]);

  const updateProjectStage = useCallback(async (id: string, stage: Project['currentStage']) => {
    const p = await crmService.updateProjectStage(id, stage);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const setProjectTeam = useCallback(async (projectId: string, patch: Partial<ProjectTeam>) => {
    const p = await crmService.setProjectTeam(projectId, patch);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const addTaskToProject = useCallback(async (projectId: string, task: Partial<Task>) => {
    const t = await crmService.addTaskToProject(projectId, task);
    await refreshProjects();
    return t;
  }, [refreshProjects]);

  const updateProjectTask = useCallback(async (projectId: string, taskIdOrKey: string, patch: Partial<Task>) => {
    const p = await crmService.updateProjectTask(projectId, taskIdOrKey, patch);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const addProjectTask = useCallback(async (projectId: string, task: Partial<Task>) => {
    const t = await crmService.addTaskToProject(projectId, task);
    await refreshProjects();
    return t;
  }, [refreshProjects]);

  const addFieldVisit = useCallback(async (projectId: string, visit: Omit<FieldVisit, 'id'>) => {
    const p = await crmService.addFieldVisit(projectId, visit);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const submitToAuthority = useCallback(async (projectId: string, data: { date: string; mode: string; ackNo?: string; files?: any[] }) => {
    const p = await crmService.submitToAuthority(projectId, data);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const setProjectApprovalStep = useCallback(async (projectId: string, stepKey: string, done: boolean) => {
    const p = await crmService.setProjectApprovalStep(projectId, stepKey, done);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const setClosureStep = useCallback(async (projectId: string, key: string, done: boolean) => {
    const p = await crmService.setClosureStep(projectId, key, done);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const closeProject = useCallback(async (projectId: string, note?: string) => {
    const p = await crmService.closeProject(projectId, note);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const addProjectDocuments = useCallback(async (projectId: string, files: any[], category: string) => {
    const p = await crmService.addProjectDocuments(projectId, files, category);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const toggleDocumentSharing = useCallback(async (projectId: string, fileId: string) => {
    const p = await crmService.toggleDocumentSharing(projectId, fileId);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const addGovtLetter = useCallback(async (projectId: string, letter: Omit<GovtLetter, 'id'>) => {
    const gl = await crmService.addGovtLetter(projectId, letter);
    await Promise.all([refreshProjects(), refreshGovtDocuments()]);
    return gl;
  }, [refreshProjects, refreshGovtDocuments]);

  const createProject = useCallback(async (data: Partial<Project>) => {
    const p = await crmService.createProject(data);
    await refreshProjects();
    return p;
  }, [refreshProjects]);

  const submitDeliverable = useCallback(async (projectId: string, deliv: Omit<any, 'id' | 'projectId' | 'submissionDate' | 'status'>) => {
    const d = await crmService.submitDeliverable(projectId, deliv);
    await refreshProjects();
    return d;
  }, [refreshProjects]);

  const addVendor = useCallback(async (data: Omit<Vendor, 'id'>) => {
    const v = await crmService.addVendor(data);
    await refreshVendors();
    return v;
  }, [refreshVendors]);

  const updateVendor = useCallback(async (id: string, patch: Partial<Vendor>) => {
    const v = await crmService.updateVendor(id, patch);
    await refreshVendors();
    return v;
  }, [refreshVendors]);

  const submitVendorApplication = useCallback(async (details: Omit<VendorApplication, 'id' | 'submittedAt' | 'status' | 'history'>, files?: any[]) => {
    const a = await crmService.submitVendorApplication(details, files);
    await refreshVendorApplications();
    return a;
  }, [refreshVendorApplications]);

  const resubmitVendorApplication = useCallback(async (id: string, details: Partial<VendorApplication>, files?: any[]) => {
    const a = await crmService.resubmitVendorApplication(id, details, files);
    await Promise.all([refreshVendorApplications(), refreshVendors()]);
    return a;
  }, [refreshVendorApplications, refreshVendors]);

  const decideVendorApplication = useCallback(async (
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    options?: { note?: string; reason?: string; tdsRate?: number; actorName?: string }
  ) => {
    const res = await crmService.decideVendorApplication(id, decision, options);
    await Promise.all([refreshVendorApplications(), refreshVendors()]);
    return res;
  }, [refreshVendorApplications, refreshVendors]);

  const publishTender = useCallback(async (tenderData: Partial<Tender>, files?: any[]) => {
    const t = await crmService.publishTender(tenderData, files);
    await refreshTenders();
    return t;
  }, [refreshTenders]);

  const closeBidding = useCallback(async (tenderId: string, actorName?: string) => {
    const t = await crmService.closeBidding(tenderId, actorName);
    await refreshTenders();
    return t;
  }, [refreshTenders]);

  const submitSealedBid = useCallback(async (tenderId: string, vendorId: string, vendorName: string, amount: number) => {
    await crmService.submitSealedBid(tenderId, vendorId, vendorName, amount);
    await refreshTenders();
  }, [refreshTenders]);

  const submitBidWithDetails = useCallback(async (tenderId: string, bidData: any) => {
    const b = await crmService.submitBidWithDetails(tenderId, bidData);
    await refreshTenders();
    return b;
  }, [refreshTenders]);

  const withdrawBid = useCallback(async (tenderId: string, vendorId: string, actorName?: string) => {
    await crmService.withdrawBid(tenderId, vendorId, actorName);
    await refreshTenders();
  }, [refreshTenders]);

  const unsealTenderBids = useCallback(async (tenderId: string, dirKey: boolean, tmKey: boolean) => {
    const t = await crmService.unsealTenderBids(tenderId, dirKey, tmKey);
    await refreshTenders();
    return t;
  }, [refreshTenders]);

  const decideBid = useCallback(async (tenderId: string, bidId: string, decision: 'shortlist' | 'reject', options?: any) => {
    const t = await crmService.decideBid(tenderId, bidId, decision, options);
    await refreshTenders();
    return t;
  }, [refreshTenders]);

  const allotTender = useCallback(async (tenderId: string, vendorId: string, vendorName: string, amount: number, projectTitle?: string, remarks?: string) => {
    const wo = await crmService.allotTender(tenderId, vendorId, vendorName, amount, projectTitle, remarks);
    await Promise.all([refreshTenders(), refreshWorkOrders()]);
    return wo;
  }, [refreshTenders, refreshWorkOrders]);

  const askClarification = useCallback(async (tenderId: string, question: string, vendorId: string, vendorName: string) => {
    const c = await crmService.askClarification(tenderId, question, vendorId, vendorName);
    await refreshClarifications();
    return c;
  }, [refreshClarifications]);

  const answerClarification = useCallback(async (clarificationId: string, answer: string, answeredBy: string) => {
    const c = await crmService.answerClarification(clarificationId, answer, answeredBy);
    await refreshClarifications();
    return c;
  }, [refreshClarifications]);

  const toggleSavedTender = useCallback(async (tenderId: string, vendorId?: string) => {
    const res = await crmService.toggleSavedTender(tenderId, vendorId);
    await refreshSavedTenders();
    return res;
  }, [refreshSavedTenders]);

  const updateWorkOrderStage = useCallback(async (woId: string, stage: WorkOrder['currentStage']) => {
    const wo = await crmService.updateWorkOrderStage(woId, stage);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const startWorkOrder = useCallback(async (woId: string, notes?: string, date?: string) => {
    const wo = await crmService.startWorkOrder(woId, notes, date);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const deliverWorkOrder = useCallback(async (woId: string, deliveryData: { notes: string; files?: any[]; date?: string }) => {
    const wo = await crmService.deliverWorkOrder(woId, deliveryData);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const billWorkOrder = useCallback(async (woId: string, billData: { billNo: string; amount: number; tdsRate?: number; invoiceUrl?: string; date?: string; notes?: string }) => {
    const wo = await crmService.billWorkOrder(woId, billData);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const checkWorkOrderBill = useCallback(async (woId: string, decision: 'approved' | 'returned', options?: { note?: string; actorName?: string }) => {
    const wo = await crmService.checkWorkOrderBill(woId, decision, options);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const payWorkOrder = useCallback(async (woId: string, paymentData: { utrRef: string; paymentMode?: string; tdsRate?: number; tdsSection?: string; date?: string; remarks?: string; actorName?: string }) => {
    const wo = await crmService.payWorkOrder(woId, paymentData);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const submitWorkOrderBill = useCallback(async (woId: string, billNo: string, amount: number, tdsRate?: number) => {
    const wo = await crmService.submitWorkOrderBill(woId, billNo, amount, tdsRate);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const verifyAndPayWorkOrderBill = useCallback(async (woId: string, billId: string, utrRef: string) => {
    const wo = await crmService.verifyAndPayWorkOrderBill(woId, billId, utrRef);
    await refreshWorkOrders();
    return wo;
  }, [refreshWorkOrders]);

  const verifyGovtDocument = useCallback(async (
    docId: string,
    options: { ok: boolean; reason?: string; note?: string },
    verifierId: string = 'emp-001',
    verifierName: string = 'Kritika Gupta'
  ) => {
    const res = await crmService.verifyGovtDocument(docId, options, verifierId, verifierName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const replaceDocScan = useCallback(async (
    docId: string,
    options: { fileName: string; scanId?: string },
    uploaderName: string = 'A. Singh'
  ) => {
    const res = await crmService.replaceDocScan(docId, options, uploaderName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const linkGovtDocument = useCallback(async (
    docId: string,
    links: { leaseNo?: string; vendorId?: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.linkGovtDocument(docId, links, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const authorizeGovtDocument = useCallback(async (
    docId: string,
    options: { client: boolean; vendor: boolean; original: boolean },
    actorName: string = 'Kritika Gupta'
  ) => {
    const res = await crmService.authorizeGovtDocument(docId, options, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const shareGovtDocument = useCallback(async (
    docId: string,
    how: 'WhatsApp' | 'marked' = 'WhatsApp',
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.shareGovtDocument(docId, how, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const requestGovtDocumentDispatch = useCallback(async (
    docId: string,
    needed: boolean,
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.requestGovtDocumentDispatch(docId, needed, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const dispatchGovtDocument = useCallback(async (
    docId: string,
    details: { mode: string; docket: string; on: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.dispatchGovtDocument(docId, details, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const receiveGovtDocument = useCallback(async (
    docId: string,
    details: { receivedBy: string; on: string },
    actorName: string = 'A. Singh'
  ) => {
    const res = await crmService.receiveGovtDocument(docId, details, actorName);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const addScans = useCallback(async (
    files: Array<{ name: string; size?: number; type?: string }>,
    scanner: string = 'Uploaded'
  ) => {
    const res = await crmService.addScans(files, scanner);
    await refreshGovtDocuments();
    return res;
  }, [refreshGovtDocuments]);

  const discardScan = useCallback(async (scanId: string) => {
    await crmService.discardScan(scanId);
    await refreshGovtDocuments();
  }, [refreshGovtDocuments]);

  const fileScanToProject = useCallback(async (
    scanId: string,
    projectId: string,
    letterData: any,
    filedBy: string = 'A. Singh'
  ) => {
    const res = await crmService.fileScanToProject(scanId, projectId, letterData, filedBy);
    await Promise.all([refreshGovtDocuments(), refreshProjects()]);
    return res;
  }, [refreshGovtDocuments, refreshProjects]);

  const verifyDocument = useCallback(async (docId: string, verifierId: string, verifierName: string, remarks: string) => {
    const doc = await crmService.verifyDocument(docId, verifierId, verifierName, remarks);
    await refreshDocuments();
    return doc;
  }, [refreshDocuments]);

  const logDispatch = useCallback(async (data: Omit<DispatchRecord, 'id' | 'status'>) => {
    const disp = await crmService.logDispatch(data);
    await refreshDispatches();
    return disp;
  }, [refreshDispatches]);

  const value = useMemo<CrmContextType>(
    () => ({
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
      refreshLeads,
      refreshClients,
      refreshFollowUps,
      refreshQuotes,
      refreshProjects,
      refreshTenders,
      refreshWorkOrders,
      refreshVendors,
      refreshVendorApplications,
      refreshClarifications,
      refreshSavedTenders,
      refreshDocuments,
      refreshDispatches,
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
    }),
    [
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
      loadData,
      refreshLeads,
      refreshClients,
      refreshFollowUps,
      refreshQuotes,
      refreshProjects,
      refreshTenders,
      refreshWorkOrders,
      refreshVendors,
      refreshVendorApplications,
      refreshClarifications,
      refreshSavedTenders,
      refreshDocuments,
      refreshDispatches,
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
    ]
  );

  return (
    <CrmContext.Provider value={value}>
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
