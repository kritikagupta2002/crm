export type LeadStage =
  | 'New Enquiry'
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export interface Lead {
  id: string;
  title: string;
  company: string;
  contactName: string;
  contactPerson?: string;
  clientType?: 'Company' | 'Individual';
  email: string;
  phone: string;
  location?: string;
  preferredContact?: 'Call' | 'WhatsApp' | 'Email' | 'Visit';
  service?: string;
  serviceDetail?: string;
  services?: Array<{ service: string; serviceDetail: string }>;
  mineral?: string;
  priority?: 'High' | 'Medium' | 'Low';
  source?: string;
  referredBy?: string;
  expectedTimeline?: string;
  estimatedValue: number;
  quoteValue?: number;
  stage: LeadStage;
  lostReason?: string;
  notes: string;
  description?: string;
  assignedTo: string;
  createdAt: string;
  createdOn?: string;
  wonOn?: string;
  nextFollowUp?: string;
  quoteStatus?: QuoteStatus;
  quote?: any;
  changeRequest?: { at: string; text: string };
  approval?: {
    quoteAccepted?: boolean;
    poReceived?: boolean;
    advanceReceived?: boolean;
    agreementSigned?: boolean;
  };
  onboarding?: {
    kyc?: boolean;
    leaseDocs?: boolean;
    kickoff?: boolean;
    teamAssigned?: boolean;
    portal?: boolean;
  };
  documents?: Array<{ id: string; name: string; size?: number; type?: string; addedOn?: string }>;
  queries?: Array<{ id: string; query: string; answer?: string; status: 'Open' | 'Resolved'; createdAt: string }>;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  contactPerson?: string;
  leadId?: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  location?: string;
  billingAddress: string;
  state: string;
  contractStatus: 'Active' | 'Under Onboarding' | 'Suspended';
  totalValue: number;
  activeProjectsCount: number;
  onboarding?: {
    kyc?: boolean;
    leaseDocs?: boolean;
    kickoff?: boolean;
    teamAssigned?: boolean;
    portal?: boolean;
  };
  createdAt: string;
}

export interface FollowUp {
  id: string;
  leadId?: string;
  clientId?: string;
  clientName: string;
  title?: string;
  date: string;
  time?: string;
  interactionType?: 'Phone Call' | 'Meeting' | 'Site Visit' | 'Email' | 'Call' | 'Presentation' | 'Review';
  type?: 'Call' | 'Meeting' | 'Site Visit' | 'Presentation' | 'Review' | 'Email';
  outcome?: string;
  notes?: string;
  note?: string;
  status: 'Pending' | 'Completed';
}

export interface QuoteLineItem {
  id: string;
  description: string;
  unit?: string;
  quantity?: number;
  qty?: number;
  rate: number;
  amount: number;
}

export type QuoteStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Sent'
  | 'Revised'
  | 'Changes requested'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface Quote {
  id: string;
  quoteNo: string;
  leadId?: string;
  clientId: string;
  clientName: string;
  projectTitle: string;
  service?: string;
  date: string;
  sentOn?: string;
  validUntil?: string;
  validDays?: number;
  version?: number;
  lineItems: QuoteLineItem[];
  items?: QuoteLineItem[];
  subtotal: number;
  net?: number;
  discount: number;
  discountPct?: number;
  gstRate: number; // 0.18 standard
  gstAmount: number;
  gst?: number;
  total: number;
  status: QuoteStatus;
  displayStatus?: string;
  requiresDirectorApproval: boolean;
  approvalRemarks?: string;
}

export type ProjectStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProjectStage {
  stage: ProjectStageNumber;
  name: string;
  key?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedAt?: string;
}

export interface Task {
  id: string;
  projectId: string;
  key?: string;
  title: string;
  assigneeName: string;
  assignee?: string;
  dueDate: string;
  due?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Todo' | 'In Progress' | 'Under Review' | 'Completed';
  standard?: boolean;
  assignedOn?: string | null;
  doneOn?: string | null;
  overdue?: boolean;
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  version: string;
  fileName: string;
  submissionDate: string;
  status: 'Draft' | 'Submitted' | 'Client Approved' | 'Revision Requested';
  fileSize?: string;
}

export interface ProjectTeam {
  coordinator?: string | null;
  teamLead?: string | null;
  members: string[];
}

export interface ProjectMilestone {
  key: string;
  label: string;
  at?: number;
  date?: string | null;
  done: boolean;
}

export interface ProjectApprovalStep {
  key: string;
  label: string;
  days?: number;
  date?: string | null;
  done: boolean;
  letter?: string;
}

export interface GovtLetter {
  id: string;
  title: string;
  authority: string;
  ref: string;
  date: string;
  stepKey?: string;
  forStep?: string;
  stepLabel?: string;
  fileId?: string;
  sharedOn?: string | null;
}

export interface FieldVisitFile {
  id: string;
  name: string;
  size: number;
  type: string;
  shared?: boolean;
}

export interface FieldVisit {
  id: string;
  date: string;
  by: string;
  activity: string;
  location?: string;
  notes?: string;
  files: FieldVisitFile[];
}

export interface ProjectClosureStep {
  key: string;
  label: string;
  done: boolean;
  date?: string | null;
}

export interface ProjectClosure {
  steps: ProjectClosureStep[];
  closedOn?: string | null;
  note?: string | null;
}

export interface AuthoritySubmission {
  mode: string;
  ackNo?: string;
  date?: string;
  by?: string;
  files?: Array<{ id: string; name: string; size: number; type: string; shared?: boolean }>;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category?: string;
  addedOn?: string;
  shared?: boolean;
  from?: string;
}

export interface ProjectHistoryItem {
  id: string;
  kind: string;
  date: string;
  text: string;
}

export interface Project {
  id: string;
  projectCode: string;
  leadId?: string;
  clientId: string;
  clientName: string;
  title: string;
  name?: string;
  service?: string;
  location: string;
  site?: string;
  authority?: string;
  code?: string;
  refBase?: string;
  baselineBudget: number;
  currentStage: ProjectStageNumber;
  stageIndex?: number;
  stageName: string;
  status?: 'Not started' | 'In progress' | 'Awaiting approval' | 'Approved' | 'Completed';
  startedOn?: string | null;
  startDate: string;
  endDate: string;
  dueOn?: string | null;
  team?: ProjectTeam;
  milestones?: ProjectMilestone[];
  approvals?: ProjectApprovalStep[];
  letters?: GovtLetter[];
  fieldVisits?: FieldVisit[];
  closure?: ProjectClosure;
  submission?: AuthoritySubmission;
  documents?: ProjectFile[];
  stages: ProjectStage[];
  tasks: Task[];
  deliverables: Deliverable[];
  workOrders?: any[];
  history?: ProjectHistoryItem[];
  now?: { label: string; date?: string | null };
}

export type TenderStatus = 'Draft' | 'Open' | 'Sealed' | 'Under Evaluation' | 'Evaluation' | 'Awarded' | 'Allotted' | 'Cancelled';

export interface BidDocument {
  id: string;
  kind: string;
  name: string;
  size: number;
  type?: string;
}

export interface SealedBid {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  bidAmount: number;
  submissionDate: string;
  isSealed: boolean;
  unsealedAt?: string;
  rank?: number;
  submittedAt?: string;
  amount?: number;
  gstPct?: number;
  days?: number;
  startFrom?: string;
  validityDays?: number;
  note?: string;
  emdRef?: string;
  technicalSpecs?: string;
  timelineWeeks?: number;
  contactPerson?: string;
  contactPhone?: string;
  remarks?: string;
  documents?: BidDocument[];
  status?: 'Submitted' | 'Shortlisted' | 'Allotted' | 'Rejected' | 'Not selected' | 'Withdrawn';
  reason?: string;
  remark?: string;
  withdrawnAt?: string;
  history?: Array<{ at: string; action: string; by: string; note?: string | null }>;
}

export interface TenderClarification {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName?: string;
  question: string;
  askedAt: string;
  date?: string;
  at?: string;
  answer?: string | null;
  answeredAt?: string | null;
  answeredBy?: string | null;
}

export interface Tender {
  id: string;
  tenderNo?: string;
  refNo?: string;
  title: string;
  category?: string;
  service?: string;
  projectId?: string;
  forProject?: string;
  location?: string;
  pincode?: string;
  tenderCategory?: 'Services' | 'Works' | 'Goods' | string;
  contractForm?: 'Lump-sum' | 'Item rate' | 'Percentage' | string;
  description?: string;
  prequal?: string;
  technicalRequirements?: string[];
  issuingAuthority?: string;
  estimatedValue: number;
  estimate?: number;
  showEstimate?: boolean;
  emdAmount: number;
  emd?: number;
  periodDays?: number;
  bidValidityDays?: number;
  preBid?: { at: string; place: string } | null;
  publishedAt?: string;
  submissionDeadline?: string;
  closesAt?: string;
  openingDate: string;
  opensAt?: string;
  closedEarlyAt?: string | null;
  status: TenderStatus;
  sealedBids: SealedBid[];
  awardedToVendorId?: string;
  awardedAmount?: number;
  allotted?: { bidId: string; vendorId: string; orderId?: string; projectId?: string; at: string } | null;
  documents?: Array<{ id: string; kind: string; name: string; size: number; type?: string }>;
  authority?: { name: string; designation: string; address: string };
  notified?: number;
  history?: Array<{ at: string; action: string; by: string; note?: string | null }>;
}

export type WorkOrderStage = 'Issued' | 'Started' | 'Delivered' | 'Billed' | 'Verified' | 'Paid';

export interface MilestoneBill {
  id: string;
  woId: string;
  billNo: string;
  invoiceNo?: string;
  date: string;
  amount: number;
  tdsRate: number; // e.g. 0.02
  tdsAmount: number;
  netPayable: number;
  status: 'Submitted' | 'Verified' | 'Paid' | 'Returned' | 'Approved' | 'Rejected';
  utrRef?: string;
  utrNo?: string;
  paidDate?: string;
  file?: any;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  tenderId?: string;
  bidId?: string;
  vendor?: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  projectTitle: string;
  work?: string;
  scope?: string;
  scopeOfWork?: string;
  contractValue: number;
  amount?: number;
  billedAmount: number;
  paidAmount: number;
  currentStage: WorkOrderStage;
  status?: string;
  issuedOn?: string;
  dueOn?: string;
  startedOn?: string | null;
  delivery?: { on: string; note: string; files: any[]; by: string } | null;
  bill?: { no: string; date: string; amount: number; file?: any; by: string } | null;
  check?: { on: string; ok: boolean; by: string; note?: string | null } | null;
  payment?: { on: string; gross: number; tds: { section: string; rate: number; amount: number }; ref: string; by: string } | null;
  returned?: Array<{ no: string; returnedOn: string; reason: string; amount?: number; by: string }>;
  delayDays?: number;
  late?: boolean;
  match?: { delivery: boolean; amount: boolean; diff: number };
  milestoneBills: MilestoneBill[];
  history?: Array<{ at: string; action: string; by: string; note?: string | null }>;
}

export interface Vendor {
  id: string;
  vendorCode?: string;
  name: string;
  category?: 'Drilling Contractor' | 'Assay Laboratory' | 'Geophysical Survey' | 'Equipment Supplier' | string;
  categories?: string[];
  work?: string;
  place?: string;
  gstin: string;
  pan: string;
  contactPerson?: string;
  contact?: string;
  phone: string;
  email: string;
  rating?: number;
  empanelledStatus?: 'Active' | 'Under Review' | 'Suspended';
  approvalStatus?: 'approved' | 'rejected' | 'pending';
  workCategory?: string;
  tds?: { section: string; rate: number } | number;
  bank?: { name: string; accountNo: string; ifsc: string };
  bankDetails?: { bankName?: string; accountNumber?: string; ifscCode?: string };
  since?: string;
  msme?: string | null;
  msmeRegistrationNo?: string;
  address?: any;
  applicationId?: string;
}

export interface VendorApplication {
  id: string;
  submittedAt: string;
  status: 'New' | 'Changes requested' | 'Approved' | 'Rejected';
  firm: {
    name: string;
    companyType: string;
    regNo: string;
    partners: string;
    year: string;
    nature: string;
    legalStatus: string;
    category: string;
    preferential: boolean;
    preference?: string;
    preferenceNo?: string;
  };
  work: {
    categories: string[];
    areas: string;
    experience: string;
    accreditation: string;
    turnover: string;
  };
  address: {
    line: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
  };
  contact: {
    title: string;
    name: string;
    dob?: string;
    designation: string;
    phone?: string;
    mobile: string;
    email: string;
    mobileVerified?: boolean;
  };
  tax: {
    pan: string;
    gstRegistered: boolean;
    gstin: string;
  };
  bank: {
    holder: string;
    bank: string;
    branch: string;
    accountNo: string;
    ifsc: string;
    type: string;
  };
  documents: Array<{ id: string; kind: string; name: string; size: number; type?: string }>;
  history: Array<{ at: string; action: string; by: string; note?: string | null }>;
  note?: string | null;
  reason?: string | null;
  vendorId?: string | null;
  decidedAt?: string | null;
}

export interface DocumentItem {
  id: string;
  docNo: string;
  title: string;
  category: 'Mineral Concession Deed' | 'Assay Report' | 'CAD Topo Map' | 'Environmental Clearance' | 'Subcontract Agreement' | string;
  projectCode: string;
  confidentiality: 'Public' | 'Internal' | 'Confidential' | 'Strictly Secret';
  uploadedBy: string;
  uploaderName: string;
  uploadDate: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifierName?: string;
  verificationRemarks?: string;
  accessRoles: string[];
  fileUri?: string;
  fileName?: string;
  fileSize?: string;
  pages?: number;
}

export interface DispatchRecord {
  id: string;
  docId: string;
  docTitle: string;
  recipientName: string;
  recipientOrg: string;
  destination: string;
  courierName: string;
  waybillNumber: string;
  dispatchDate: string;
  status: 'In Transit' | 'Delivered' | 'To dispatch' | 'Dispatched' | 'Received';
  receivedOn?: string;
  receivedBy?: string;
  mode?: string;
  docket?: string;
  on?: string;
}

export interface GovtDocumentRecord {
  filedBy: string;
  filedAt: string;
  links: {
    leaseNo?: string;
    vendorId?: string;
  };
  verify?: {
    status: 'Verified' | 'Rescan';
    by: string;
    at: string;
    reason?: string;
    note?: string;
  } | null;
  access?: {
    client?: boolean;
    vendor?: boolean;
    by: string;
    at: string;
  } | null;
  dispatch?: {
    status: 'Not needed' | 'To dispatch' | 'Dispatched' | 'Received';
    mode?: string;
    docket?: string;
    on?: string;
    by?: string;
    receivedBy?: string;
    receivedOn?: string;
  };
  events: Array<{
    at: string;
    by: string;
    text: string;
  }>;
}

export interface GovtDocument {
  id: string;
  letter: {
    id: string;
    title: string;
    ref: string;
    date: string;
    kind?: string;
    pages?: number;
    sharedOn?: string | null;
    authority?: string;
  };
  project: {
    id: string;
    name: string;
    projectCode?: string;
    lead?: {
      id: string;
      company: string;
      contactPerson: string;
      phone?: string;
      email?: string;
      location?: string;
    };
    clientName?: string;
  };
  lead: {
    id: string;
    company: string;
    contactPerson: string;
    phone?: string;
    email?: string;
    location?: string;
  };
  record: GovtDocumentRecord;
  kind: string;
  stage: 'To verify' | 'To authorize' | 'To share' | 'To dispatch' | 'Done';
  rescan: boolean;
  nas: string;
  vendor?: { id: string; name: string } | null;
}

export interface ScanItem {
  id: string;
  name: string;
  scannedAt: string;
  pages?: number;
  size: number;
  type?: string;
  scanner: string;
  seeded?: boolean;
  file?: any;
}

