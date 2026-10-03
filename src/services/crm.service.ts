import { mobileStorage } from '../storage';
import {
  Lead,
  Client,
  FollowUp,
  Quote,
  Project,
  ProjectStage,
  ProjectStageNumber,
  ProjectTeam,
  GovtLetter,
  FieldVisit,
  Tender,
  SealedBid,
  TenderClarification,
  WorkOrder,
  MilestoneBill,
  Vendor,
  VendorApplication,
  DocumentItem,
  DispatchRecord,
  Task,
  Deliverable,
  GovtDocument,
  GovtDocumentRecord,
  ScanItem,
} from '../types';
import {
  QUOTATION_RULES,
  ERM_STAGES,
  CLOSURE_STEPS,
  APPROVALS,
  MILESTONES,
  govtDocuments,
  verifyBlock,
  accessLabel,
} from '../constants';


export class CrmService {
  // Leads
  async getLeads(): Promise<Lead[]> {
    return mobileStorage.getLeads();
  }

  async addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const newLead: Lead = {
      ...lead,
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    leads.unshift(newLead);
    await mobileStorage.setLeads(leads);
    return newLead;
  }

  async updateLeadStage(id: string, stage: Lead['stage'], extra?: Partial<Lead>): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const target = leads.find((l) => l.id === id);
    if (!target) throw new Error('Lead not found.');
    target.stage = stage;
    if (extra) {
      Object.assign(target, extra);
    }
    await mobileStorage.setLeads(leads);
    return target;
  }

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Lead not found.');
    leads[index] = { ...leads[index], ...patch };
    await mobileStorage.setLeads(leads);
    return leads[index];
  }

  // Follow-ups
  async getFollowUps(): Promise<FollowUp[]> {
    return mobileStorage.getFollowUps();
  }

  async scheduleFollowUp(data: Omit<FollowUp, 'id' | 'status'>): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const newFU: FollowUp = {
      ...data,
      id: 'fu-' + Date.now(),
      status: 'Pending',
    };
    followUps.unshift(newFU);
    await mobileStorage.setFollowUps(followUps);

    if (data.leadId) {
      const leads = await mobileStorage.getLeads();
      const lead = leads.find((l) => l.id === data.leadId);
      if (lead) {
        lead.nextFollowUp = data.date;
        await mobileStorage.setLeads(leads);
      }
    }
    return newFU;
  }

  async completeFollowUp(id: string, outcome: string): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const target = followUps.find((f) => f.id === id);
    if (!target) throw new Error('Follow-up not found.');
    target.status = 'Completed';
    target.outcome = outcome;
    await mobileStorage.setFollowUps(followUps);
    return target;
  }

  async rescheduleFollowUp(id: string, newDate: string, newTime?: string): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const target = followUps.find((f) => f.id === id);
    if (!target) throw new Error('Follow-up not found.');
    target.date = newDate;
    if (newTime) target.time = newTime;
    await mobileStorage.setFollowUps(followUps);

    if (target.leadId) {
      const leads = await mobileStorage.getLeads();
      const lead = leads.find((l) => l.id === target.leadId);
      if (lead) {
        lead.nextFollowUp = newDate;
        await mobileStorage.setLeads(leads);
      }
    }
    return target;
  }

  // Workflow: Client Approvals & Onboarding
  async updateApprovalStep(leadId: string, key: string, value: boolean): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found.');
    if (!lead.approval) lead.approval = {};
    (lead.approval as any)[key] = value;
    await mobileStorage.setLeads(leads);
    return lead;
  }

  async updateOnboardingStep(leadId: string, key: string, value: boolean): Promise<Lead> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found.');
    if (!lead.onboarding) lead.onboarding = {};
    (lead.onboarding as any)[key] = value;
    await mobileStorage.setLeads(leads);

    const clients = await mobileStorage.getClients();
    const client = clients.find((c) => c.leadId === leadId || c.name === lead.company);
    if (client) {
      if (!client.onboarding) client.onboarding = {};
      (client.onboarding as any)[key] = value;
      const allDone = ['kyc', 'leaseDocs', 'kickoff', 'teamAssigned', 'portal'].every(
        (k) => (client.onboarding as any)?.[k]
      );
      if (allDone) client.contractStatus = 'Active';
      await mobileStorage.setClients(clients);
    }
    return lead;
  }

  // Cross-module Lead Conversion: Creates Client + Project Draft
  async convertLead(id: string, gstin?: string, pan?: string): Promise<{ client: Client; project: Project }> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error('Lead not found.');

    lead.stage = 'Won';
    await mobileStorage.setLeads(leads);

    // 1. Create Client
    const clients = await mobileStorage.getClients();
    const clientId = 'cli-' + Date.now();
    const newClient: Client = {
      id: clientId,
      name: lead.company,
      gstin: gstin || '08AAACX0000X1Z0',
      pan: pan || 'AAACX0000X',
      email: lead.email,
      phone: lead.phone,
      billingAddress: 'Corporate Office',
      state: 'Rajasthan',
      contractStatus: 'Active',
      totalValue: lead.estimatedValue,
      activeProjectsCount: 1,
      createdAt: new Date().toISOString().split('T')[0],
    };
    clients.unshift(newClient);
    await mobileStorage.setClients(clients);

    // 2. Create Project Draft
    const projects = await mobileStorage.getProjects();
    const projId = 'prj-' + Date.now();
    const newProject: Project = {
      id: projId,
      projectCode: 'PRJ-GEO-' + new Date().getFullYear() + '-' + (projects.length + 1).toString().padStart(3, '0'),
      clientId: clientId,
      clientName: lead.company,
      title: lead.title,
      location: 'Site Location',
      baselineBudget: lead.estimatedValue,
      currentStage: 1,
      stageName: 'Stage 1: Allocation',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      stages: [
        { stage: 1, name: 'Stage 1: Allocation', status: 'In Progress' },
        { stage: 2, name: 'Stage 2: Planning', status: 'Pending' },
        { stage: 3, name: 'Stage 3: Task Execution', status: 'Pending' },
        { stage: 4, name: 'Stage 4: Deliverable Submission', status: 'Pending' },
        { stage: 5, name: 'Stage 5: Client Approval', status: 'Pending' },
        { stage: 6, name: 'Stage 6: Invoicing', status: 'Pending' },
        { stage: 7, name: 'Stage 7: Project Closure', status: 'Pending' },
      ],
      tasks: [],
      deliverables: [],
    };
    projects.unshift(newProject);
    await mobileStorage.setProjects(projects);

    return { client: newClient, project: newProject };
  }

  // Quotes
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

    // Also synchronize into quotes list
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

  // Projects (7-Stage Lifecycle & ERM Operations)
  private normalizeProject(proj: Project): Project {
    const currentStage = (proj.currentStage || 1) as ProjectStageNumber;
    const stageIndex = proj.stageIndex !== undefined ? proj.stageIndex : (currentStage - 1);

    const stageNames: Record<number, string> = {
      1: 'Stage 1: Allocation',
      2: 'Stage 2: Planning',
      3: 'Stage 3: Task Execution',
      4: 'Stage 4: Deliverable Submission',
      5: 'Stage 5: Client Approval',
      6: 'Stage 6: Invoicing',
      7: 'Stage 7: Project Closure',
    };

    const stages: ProjectStage[] = (proj.stages && proj.stages.length === 7) ? proj.stages : [
      { stage: 1, name: 'Stage 1: Allocation', key: 'allocation', status: currentStage > 1 ? 'Completed' : currentStage === 1 ? 'In Progress' : 'Pending' },
      { stage: 2, name: 'Stage 2: Planning', key: 'planning', status: currentStage > 2 ? 'Completed' : currentStage === 2 ? 'In Progress' : 'Pending' },
      { stage: 3, name: 'Stage 3: Task Execution', key: 'tasks', status: currentStage > 3 ? 'Completed' : currentStage === 3 ? 'In Progress' : 'Pending' },
      { stage: 4, name: 'Stage 4: Deliverable Submission', key: 'submission', status: currentStage > 4 ? 'Completed' : currentStage === 4 ? 'In Progress' : 'Pending' },
      { stage: 5, name: 'Stage 5: Client Approval', key: 'approval', status: currentStage > 5 ? 'Completed' : currentStage === 5 ? 'In Progress' : 'Pending' },
      { stage: 6, name: 'Stage 6: Invoicing', key: 'invoicing', status: currentStage > 6 ? 'Completed' : currentStage === 6 ? 'In Progress' : 'Pending' },
      { stage: 7, name: 'Stage 7: Project Closure', key: 'closure', status: currentStage === 7 ? 'Completed' : 'Pending' },
    ];

    const team = proj.team || { coordinator: null, teamLead: null, members: [] };
    const service = proj.service || 'Mineral Exploration & Resources';
    const approvalConfig = APPROVALS[service] || APPROVALS['Mineral Exploration & Resources'];

    const milestones = proj.milestones || MILESTONES.map((m) => ({
      key: m.key,
      label: m.label,
      at: m.at,
      date: proj.startDate,
      done: false,
    }));

    const approvals = proj.approvals || approvalConfig.steps.map((s) => ({
      key: s.key,
      label: s.label,
      days: s.days,
      date: null,
      done: false,
      letter: s.letter,
    }));

    const closure = proj.closure || {
      steps: CLOSURE_STEPS.map((c) => ({ key: c.key, label: c.label, done: false, date: null })),
      closedOn: null,
      note: null,
    };

    const tasks = (proj.tasks || []).map((t) => ({
      ...t,
      assignee: t.assignee || t.assigneeName || '',
      assigneeName: t.assigneeName || t.assignee || 'Unassigned',
      due: t.due || t.dueDate || '',
      dueDate: t.dueDate || t.due || '',
      status: (t.status === 'Completed' || (t.status as any) === 'done') ? 'Completed' as const : (t.status === 'In Progress' || (t.status as any) === 'in-progress') ? 'In Progress' as const : 'Todo' as const,
    }));

    const fieldVisits = proj.fieldVisits || [];
    const deliverables = proj.deliverables || [];
    const letters = proj.letters || [];
    const documents = proj.documents || [];
    const history = proj.history || [];
    const submission = proj.submission || { mode: 'By hand at the office', ackNo: '', date: proj.endDate, files: [] };

    const milestonesDone = milestones.filter((m) => m.done).length;
    const approvalsDone = approvals.filter((s) => s.done).length;
    const submitted = milestones[milestones.length - 1]?.done || currentStage >= 4;
    const approved = approvalsDone === approvals.length || currentStage >= 6;
    const closed = Boolean(closure.closedOn) || currentStage === 7;

    const derivedStatus: Project['status'] = closed
      ? 'Completed'
      : approved
      ? 'Approved'
      : submitted
      ? 'Awaiting approval'
      : milestonesDone === 0 && !proj.startedOn
      ? 'Not started'
      : 'In progress';

    const nowStep = (() => {
      if (closed) return { label: 'Project closed', date: closure.closedOn };
      if (approved) return { label: 'Closure pending', date: null };
      const m = milestones.find((s) => !s.done);
      if (m) return { label: m.label, date: m.date };
      const a = approvals.find((s) => !s.done);
      if (a) return { label: a.label, date: a.date };
      return { label: stageNames[currentStage] || 'In progress', date: null };
    })();

    return {
      ...proj,
      name: proj.name || proj.title,
      title: proj.title || proj.name || 'Geological Project',
      service,
      authority: proj.authority || approvalConfig.authority,
      code: proj.code || approvalConfig.code,
      site: proj.site || proj.location,
      currentStage,
      stageIndex,
      stageName: stageNames[currentStage] || `Stage ${currentStage}`,
      status: proj.status || derivedStatus,
      stages,
      team,
      milestones,
      approvals,
      closure,
      tasks,
      fieldVisits,
      deliverables,
      letters,
      documents,
      history,
      submission,
      now: proj.now || nowStep,
    };
  }

  async getProjects(): Promise<Project[]> {
    const raw = await mobileStorage.getProjects();
    const normalized = raw.map((p) => this.normalizeProject(p));
    return normalized;
  }

  async updateProjectStage(id: string, nextStage: ProjectStageNumber): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === id);
    if (!proj) throw new Error('Project not found.');

    const stageNames: Record<number, string> = {
      1: 'Stage 1: Allocation',
      2: 'Stage 2: Planning',
      3: 'Stage 3: Task Execution',
      4: 'Stage 4: Deliverable Submission',
      5: 'Stage 5: Client Approval',
      6: 'Stage 6: Invoicing',
      7: 'Stage 7: Project Closure',
    };

    proj.currentStage = nextStage;
    proj.stageIndex = nextStage - 1;
    proj.stageName = stageNames[nextStage] || `Stage ${nextStage}`;
    
    if (!proj.stages || proj.stages.length !== 7) {
      proj.stages = [
        { stage: 1, name: 'Stage 1: Allocation', key: 'allocation', status: 'Pending' },
        { stage: 2, name: 'Stage 2: Planning', key: 'planning', status: 'Pending' },
        { stage: 3, name: 'Stage 3: Task Execution', key: 'tasks', status: 'Pending' },
        { stage: 4, name: 'Stage 4: Deliverable Submission', key: 'submission', status: 'Pending' },
        { stage: 5, name: 'Stage 5: Client Approval', key: 'approval', status: 'Pending' },
        { stage: 6, name: 'Stage 6: Invoicing', key: 'invoicing', status: 'Pending' },
        { stage: 7, name: 'Stage 7: Project Closure', key: 'closure', status: 'Pending' },
      ];
    }

    const todayISO = new Date().toISOString().split('T')[0];
    proj.stages.forEach((s) => {
      if (s.stage < nextStage) {
        s.status = 'Completed';
        if (!s.completedAt) s.completedAt = todayISO;
      } else if (s.stage === nextStage) {
        s.status = 'In Progress';
      } else {
        s.status = 'Pending';
      }
    });

    if (nextStage === 7) {
      proj.status = 'Completed';
    } else if (nextStage === 5 || nextStage === 6) {
      proj.status = 'Awaiting approval';
    } else {
      proj.status = 'In progress';
    }

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'stage',
      date: todayISO,
      text: `Project progressed to ${stageNames[nextStage]}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async setProjectTeam(projectId: string, patch: Partial<ProjectTeam>): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    if (!proj.team) {
      proj.team = { coordinator: null, teamLead: null, members: [] };
    }
    proj.team = { ...proj.team, ...patch };

    const todayISO = new Date().toISOString().split('T')[0];
    const teamSummary = [
      patch.coordinator ? `Coordinator: ${patch.coordinator}` : '',
      patch.teamLead ? `Team Lead: ${patch.teamLead}` : '',
      patch.members?.length ? `Field Team: ${patch.members.join(', ')}` : '',
    ].filter(Boolean).join(' · ');

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'team',
      date: todayISO,
      text: `Team updated: ${teamSummary || 'assignments modified'}`,
    });

    // Auto-advance Allocation -> Planning if coordinator set
    if (proj.currentStage === 1 && proj.team.coordinator) {
      proj.currentStage = 2;
      proj.stageIndex = 1;
      proj.stageName = 'Stage 2: Planning';
      if (proj.stages?.[0]) proj.stages[0].status = 'Completed';
      if (proj.stages?.[1]) proj.stages[1].status = 'In Progress';
    }
    // Auto-advance Planning -> Task Execution if teamLead & members set
    if (proj.currentStage === 2 && proj.team.teamLead && proj.team.members?.length) {
      proj.currentStage = 3;
      proj.stageIndex = 2;
      proj.stageName = 'Stage 3: Task Execution';
      if (proj.stages?.[1]) proj.stages[1].status = 'Completed';
      if (proj.stages?.[2]) proj.stages[2].status = 'In Progress';
    }

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async addTaskToProject(projectId: string, task: Partial<Task>): Promise<Task> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const todayISO = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      id: 't-' + Date.now(),
      projectId,
      title: task.title || 'Field Task',
      assigneeName: task.assigneeName || task.assignee || 'Unassigned',
      assignee: task.assignee || task.assigneeName || 'Unassigned',
      dueDate: task.dueDate || task.due || todayISO,
      due: task.due || task.dueDate || todayISO,
      priority: task.priority || 'Medium',
      status: task.status || 'Todo',
      standard: task.standard || false,
      assignedOn: task.assignee ? todayISO : null,
      doneOn: task.status === 'Completed' ? todayISO : null,
      overdue: false,
    };

    if (!proj.tasks) proj.tasks = [];
    proj.tasks.unshift(newTask);

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'task',
      date: todayISO,
      text: `Task added: "${newTask.title}" assigned to ${newTask.assigneeName}`,
    });

    await mobileStorage.setProjects(projects);
    return newTask;
  }

  async updateProjectTask(projectId: string, taskIdOrKey: string, patch: Partial<Task>): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const todayISO = new Date().toISOString().split('T')[0];
    const task = proj.tasks.find((t) => t.id === taskIdOrKey || t.key === taskIdOrKey);
    if (!task) throw new Error('Task not found.');

    Object.assign(task, patch);
    if (patch.assignee && !patch.assigneeName) task.assigneeName = patch.assignee;
    if (patch.assigneeName && !patch.assignee) task.assignee = patch.assigneeName;
    if (patch.due && !patch.dueDate) task.dueDate = patch.due;
    if (patch.dueDate && !patch.due) task.due = patch.dueDate;

    if (patch.status === 'Completed' || (patch.status as any) === 'done') {
      task.status = 'Completed';
      task.doneOn = todayISO;
      task.overdue = false;
      // If task is standard matching milestone, mark milestone done
      if (task.key && proj.milestones) {
        const ms = proj.milestones.find((m) => m.key === task.key);
        if (ms) ms.done = true;
      }
    } else if (patch.status === 'In Progress' || (patch.status as any) === 'in-progress') {
      task.status = 'In Progress';
      task.doneOn = null;
    } else if (patch.status === 'Todo' || (patch.status as any) === 'todo') {
      task.status = 'Todo';
      task.doneOn = null;
    }

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'task',
      date: todayISO,
      text: `Task "${task.title}" updated — status: ${task.status}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async addFieldVisit(projectId: string, visit: Omit<FieldVisit, 'id'>): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const newVisit: FieldVisit = {
      ...visit,
      id: 'FV-' + Date.now(),
    };

    if (!proj.fieldVisits) proj.fieldVisits = [];
    proj.fieldVisits.unshift(newVisit);

    const todayISO = new Date().toISOString().split('T')[0];
    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'visit',
      date: visit.date || todayISO,
      text: `Field visit logged: ${visit.activity} by ${visit.by} at ${visit.location || 'site'}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async submitToAuthority(projectId: string, data: { date: string; mode: string; ackNo?: string; files?: any[] }): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    proj.submission = {
      mode: data.mode,
      ackNo: data.ackNo || `${proj.refBase || 'ACK'}/SUB`,
      date: data.date,
      by: proj.team?.coordinator || 'Coordinator',
      files: data.files || [],
    };

    // Mark submission milestone done
    if (proj.milestones) {
      const subMs = proj.milestones.find((m) => m.key === 'submission');
      if (subMs) {
        subMs.done = true;
        subMs.date = data.date;
      }
    }

    // Mark first approval step done (filed)
    if (proj.approvals && proj.approvals.length > 0) {
      proj.approvals[0].done = true;
      proj.approvals[0].date = data.date;
    }

    // Advance to Stage 5: Client / Govt Approval
    proj.currentStage = 5;
    proj.stageIndex = 4;
    proj.stageName = 'Stage 5: Client Approval';
    proj.status = 'Awaiting approval';

    if (proj.stages) {
      if (proj.stages[2]) proj.stages[2].status = 'Completed';
      if (proj.stages[3]) proj.stages[3].status = 'Completed';
      if (proj.stages[4]) proj.stages[4].status = 'In Progress';
    }

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'submission',
      date: data.date,
      text: `Submitted to ${proj.authority || 'Government Authority'} via ${data.mode}${data.ackNo ? ` · Ack. ${data.ackNo}` : ''}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async setProjectApprovalStep(projectId: string, stepKey: string, done: boolean): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    if (!proj.approvals) proj.approvals = [];
    const step = proj.approvals.find((s) => s.key === stepKey);
    if (!step) throw new Error('Approval step not found.');

    const todayISO = new Date().toISOString().split('T')[0];
    step.done = done;
    step.date = done ? todayISO : null;

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'approval',
      date: todayISO,
      text: `${step.label} — ${done ? 'completed' : 'reopened'}`,
    });

    // Check if all approvals done -> move to Stage 6 (Invoicing)
    const allApprovalsDone = proj.approvals.every((s) => s.done);
    if (allApprovalsDone) {
      proj.currentStage = 6;
      proj.stageIndex = 5;
      proj.stageName = 'Stage 6: Invoicing';
      proj.status = 'Approved';
      if (proj.stages?.[4]) proj.stages[4].status = 'Completed';
      if (proj.stages?.[5]) proj.stages[5].status = 'In Progress';
    }

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async setClosureStep(projectId: string, key: string, done: boolean): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    if (!proj.closure) {
      proj.closure = {
        steps: CLOSURE_STEPS.map((c) => ({ key: c.key, label: c.label, done: false, date: null })),
        closedOn: null,
        note: null,
      };
    }

    const todayISO = new Date().toISOString().split('T')[0];
    const target = proj.closure.steps.find((s) => s.key === key);
    if (target) {
      target.done = done;
      target.date = done ? todayISO : null;
    }

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'closure',
      date: todayISO,
      text: `Closure step "${target?.label || key}" ${done ? 'completed' : 'reopened'}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async closeProject(projectId: string, note?: string): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const todayISO = new Date().toISOString().split('T')[0];
    if (!proj.closure) {
      proj.closure = {
        steps: CLOSURE_STEPS.map((c) => ({ key: c.key, label: c.label, done: true, date: todayISO })),
        closedOn: todayISO,
        note: note || null,
      };
    } else {
      proj.closure.steps.forEach((s) => {
        s.done = true;
        if (!s.date) s.date = todayISO;
      });
      proj.closure.closedOn = todayISO;
      proj.closure.note = note || null;
    }

    proj.currentStage = 7;
    proj.stageIndex = 6;
    proj.stageName = 'Stage 7: Project Closure';
    proj.status = 'Completed';

    if (proj.stages) {
      proj.stages.forEach((s) => (s.status = 'Completed'));
    }

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'closed',
      date: todayISO,
      text: `Project closed and sealed — ${note || 'technical and finance hand-over complete.'}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async addProjectDocuments(projectId: string, files: any[], category: string): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const todayISO = new Date().toISOString().split('T')[0];
    if (!proj.documents) proj.documents = [];

    files.forEach((f) => {
      proj.documents!.unshift({
        id: 'doc-' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: f.name || 'Document.pdf',
        size: f.size || 2500000,
        type: f.type || 'application/pdf',
        category: category || 'Report',
        addedOn: todayISO,
        shared: true,
      });
    });

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'document',
      date: todayISO,
      text: `${files.length} document(s) uploaded under ${category}`,
    });

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async toggleDocumentSharing(projectId: string, fileId: string): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const doc = proj.documents?.find((d) => d.id === fileId);
    if (doc) {
      doc.shared = !doc.shared;
    } else {
      proj.fieldVisits?.forEach((fv) => {
        const fvFile = fv.files.find((f) => f.id === fileId);
        if (fvFile) fvFile.shared = !fvFile.shared;
      });
    }

    const normalized = this.normalizeProject(proj);
    await mobileStorage.setProjects(projects);
    return normalized;
  }

  async addGovtLetter(projectId: string, letter: Omit<GovtLetter, 'id'>): Promise<GovtLetter> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const newLetter: GovtLetter = {
      ...letter,
      id: 'GL-' + Date.now(),
    };

    if (!proj.letters) proj.letters = [];
    proj.letters.unshift(newLetter);

    // If letter is for an approval step, mark that step done
    if (letter.forStep && proj.approvals) {
      const step = proj.approvals.find((s) => s.key === letter.forStep);
      if (step) {
        step.done = true;
        step.date = letter.date;
      }
    }

    const todayISO = new Date().toISOString().split('T')[0];
    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'letter',
      date: letter.date || todayISO,
      text: `Government letter received: "${letter.title}" (${letter.ref}) from ${letter.authority}`,
    });

    await mobileStorage.setProjects(projects);
    return newLetter;
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const projects = await mobileStorage.getProjects();
    const id = 'prj-' + Date.now();
    const year = new Date().getFullYear();
    const code = `PRJ-GEO-${year}-${String(projects.length + 1).padStart(3, '0')}`;
    const todayISO = new Date().toISOString().split('T')[0];

    const newProject: Project = {
      id,
      projectCode: code,
      clientId: data.clientId || 'cli-001',
      clientName: data.clientName || 'Direct Mining Client',
      title: data.title || 'New Exploration Block',
      name: data.title || 'New Exploration Block',
      service: data.service || 'Mineral Exploration & Resources',
      location: data.location || 'Rajasthan, India',
      site: data.site || data.location || 'Exploration Site',
      authority: data.authority || 'Department of Mines & Geology, Rajasthan',
      code: data.code || 'DMG',
      refBase: `${data.code || 'DMG'}/RAJ/${year}/${1000 + projects.length}`,
      baselineBudget: Number(data.baselineBudget) || 2500000,
      currentStage: 1,
      stageIndex: 0,
      stageName: 'Stage 1: Allocation',
      status: 'Not started',
      startDate: data.startDate || todayISO,
      startedOn: null,
      endDate: data.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      dueOn: data.endDate || new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
      team: data.team || { coordinator: null, teamLead: null, members: [] },
      stages: [
        { stage: 1, name: 'Stage 1: Allocation', key: 'allocation', status: 'In Progress' },
        { stage: 2, name: 'Stage 2: Planning', key: 'planning', status: 'Pending' },
        { stage: 3, name: 'Stage 3: Task Execution', key: 'tasks', status: 'Pending' },
        { stage: 4, name: 'Stage 4: Deliverable Submission', key: 'submission', status: 'Pending' },
        { stage: 5, name: 'Stage 5: Client Approval', key: 'approval', status: 'Pending' },
        { stage: 6, name: 'Stage 6: Invoicing', key: 'invoicing', status: 'Pending' },
        { stage: 7, name: 'Stage 7: Project Closure', key: 'closure', status: 'Pending' },
      ],
      milestones: MILESTONES.map((m) => ({
        key: m.key,
        label: m.label,
        at: m.at,
        date: new Date(Date.now() + Math.round(90 * (m.at || 0.5)) * 86400000).toISOString().split('T')[0],
        done: false,
      })),
      approvals: (APPROVALS[data.service || 'Mineral Exploration & Resources'] || APPROVALS['Mineral Exploration & Resources']).steps.map((s) => ({
        key: s.key,
        label: s.label,
        days: s.days,
        date: null,
        done: false,
        letter: s.letter,
      })),
      tasks: [],
      fieldVisits: [],
      deliverables: [],
      letters: [],
      closure: {
        steps: CLOSURE_STEPS.map((c) => ({ key: c.key, label: c.label, done: false, date: null })),
        closedOn: null,
        note: null,
      },
      submission: {
        mode: 'By hand at the office',
        ackNo: '',
        date: '',
        files: [],
      },
      documents: [],
      history: [
        { id: 'h-' + Date.now(), kind: 'created', date: todayISO, text: `Project created — ${data.title}` },
      ],
      now: { label: 'Assign a project coordinator', date: todayISO },
    };

    projects.unshift(newProject);
    await mobileStorage.setProjects(projects);
    return newProject;
  }

  async submitDeliverable(projectId: string, deliv: Omit<Deliverable, 'id' | 'projectId' | 'submissionDate' | 'status'>): Promise<Deliverable> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const newDeliv: Deliverable = {
      ...deliv,
      id: 'del-' + Date.now(),
      projectId,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
    };
    if (!proj.deliverables) proj.deliverables = [];
    proj.deliverables.unshift(newDeliv);
    await mobileStorage.setProjects(projects);
    return newDeliv;
  }

  // Vendors Master
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

  // Vendor Applications (Registration & Compliance Review)
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

  // Tenders & Sealed Bidding (Dual-Key Ceremony & L1 Comparative Matrix)
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

  // Clarifications
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

  // Saved Tenders (Bookmarks)
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

  // Subcontract Work Orders (6-Stage Lifecycle: Issued -> Started -> Delivered -> Billed -> Verified -> Paid)
  async getWorkOrders(): Promise<WorkOrder[]> {
    return mobileStorage.getWorkOrders();
  }

  async getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
    const list = await mobileStorage.getWorkOrders();
    return list.find((w) => w.id === id || w.woNumber === id);
  }

  async updateWorkOrderStage(woId: string, stage: WorkOrder['currentStage']): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');
    wo.currentStage = stage;
    wo.status = stage;
    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async startWorkOrder(woId: string, notes?: string, date?: string): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const today = date || new Date().toISOString().split('T')[0];
    wo.startedOn = today;
    wo.currentStage = 'Started';
    wo.status = 'Started';
    wo.history = wo.history || [];
    wo.history.push({ at: new Date().toISOString(), action: 'Work started / mobilized on site', by: wo.vendorName, note: notes });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async deliverWorkOrder(woId: string, deliveryData: { notes: string; files?: any[]; date?: string }): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = deliveryData.date || now.split('T')[0];
    const fileRecords = (deliveryData.files || []).map((f, i) => ({
      id: `del-f-${Date.now()}-${i}`,
      name: f.name || `Delivery-Report-${i + 1}.pdf`,
      size: f.size || 2500000,
      url: f.url || '',
    }));

    wo.delivery = {
      on: today,
      note: deliveryData.notes,
      files: fileRecords,
      by: wo.vendorName,
    };
    wo.currentStage = 'Delivered';
    wo.status = 'Delivered';
    wo.history = wo.history || [];
    wo.history.push({ at: now, action: `Delivery recorded (${fileRecords.length} attachment(s))`, by: wo.vendorName, note: deliveryData.notes });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async submitWorkOrderBill(woId: string, billNo: string, amount: number, tdsRate: number = 0.02): Promise<WorkOrder> {
    return this.billWorkOrder(woId, { billNo, amount, tdsRate });
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
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const amt = Number(billData.amount);
    const contractVal = wo.contractValue || wo.amount || 0;
    const remainingCeiling = contractVal - (wo.billedAmount || 0);

    if (amt > remainingCeiling + 0.01) {
      throw new Error(`Bill amount (₹${amt.toLocaleString('en-IN')}) exceeds remaining unbilled contract ceiling (₹${remainingCeiling.toLocaleString('en-IN')}).`);
    }

    const rate = billData.tdsRate !== undefined ? billData.tdsRate : 0.02;
    const tdsAmount = Math.round(amt * rate);
    const netPayable = amt - tdsAmount;
    const now = new Date().toISOString();
    const today = billData.date || now.split('T')[0];

    const billItem: MilestoneBill = {
      id: 'bill-' + Date.now(),
      woId: wo.id,
      billNo: billData.billNo,
      date: today,
      amount: amt,
      tdsRate: rate,
      tdsAmount,
      netPayable,
      status: 'Submitted',
      notes: billData.notes,
    };

    wo.milestoneBills = wo.milestoneBills || [];
    wo.milestoneBills.push(billItem);
    wo.billedAmount = (wo.billedAmount || 0) + amt;
    wo.bill = {
      no: billData.billNo,
      date: today,
      amount: amt,
      file: billData.invoiceUrl ? { id: `inv-${Date.now()}`, name: `${billData.billNo}.pdf`, size: 1000000, url: billData.invoiceUrl } : null,
      by: wo.vendorName,
    };
    wo.check = undefined;
    wo.currentStage = 'Billed';
    wo.status = 'Billed';
    wo.history = wo.history || [];
    wo.history.push({ at: now, action: `Bill ${billData.billNo} recorded (₹${amt.toLocaleString('en-IN')})`, by: wo.vendorName });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async checkWorkOrderBill(
    woId: string,
    decision: 'approved' | 'returned',
    options?: { note?: string; actorName?: string }
  ): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const by = options?.actorName || 'Accountant';

    if (decision === 'approved') {
      wo.check = {
        on: today,
        ok: true,
        by,
        note: options?.note || 'Verified against contract scope and delivery logs.',
      };
      if (wo.milestoneBills && wo.milestoneBills.length > 0) {
        wo.milestoneBills[wo.milestoneBills.length - 1].status = 'Approved';
      }
      wo.currentStage = 'Verified';
      wo.status = 'Verified';
      wo.history = wo.history || [];
      wo.history.push({ at: now, action: 'Bill verified against work order & delivery inspection — ready for payment release', by, note: options?.note });
    } else {
      const returnedBill = wo.bill;
      wo.returned = wo.returned || [];
      if (returnedBill) {
        wo.returned.push({
          ...returnedBill,
          returnedOn: today,
          reason: options?.note || 'Discrepancy in billing quantity / rates',
          by,
        });
      }
      if (wo.milestoneBills && wo.milestoneBills.length > 0) {
        wo.milestoneBills[wo.milestoneBills.length - 1].status = 'Rejected';
      }
      wo.bill = undefined;
      wo.check = undefined;
      wo.currentStage = 'Delivered';
      wo.status = 'Delivered';
      wo.history = wo.history || [];
      wo.history.push({ at: now, action: `Bill returned to vendor — ${options?.note || 'correction required'}`, by });
    }

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async verifyAndPayWorkOrderBill(woId: string, billId: string, utrRef: string): Promise<WorkOrder> {
    return this.payWorkOrder(woId, { utrRef });
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
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = paymentData.date || now.split('T')[0];
    const by = paymentData.actorName || 'Finance Officer';
    const grossAmount = wo.bill?.amount || wo.contractValue || wo.amount || 0;
    const rate = paymentData.tdsRate !== undefined ? paymentData.tdsRate : 0.02;
    const tdsAmount = Math.round(grossAmount * rate);
    const netPayable = grossAmount - tdsAmount;

    wo.payment = {
      on: today,
      gross: grossAmount,
      tds: {
        rate,
        section: paymentData.tdsSection || '194C',
        amount: tdsAmount,
      },
      ref: paymentData.utrRef,
      by,
    };

    if (wo.milestoneBills && wo.milestoneBills.length > 0) {
      const lastBill = wo.milestoneBills[wo.milestoneBills.length - 1];
      lastBill.status = 'Paid';
      lastBill.utrRef = paymentData.utrRef;
    }

    wo.paidAmount = (wo.paidAmount || 0) + netPayable;
    wo.currentStage = 'Paid';
    wo.status = 'Paid';
    wo.history = wo.history || [];
    wo.history.push({
      at: now,
      action: `Payment released ₹${netPayable.toLocaleString('en-IN')} (TDS ₹${tdsAmount.toLocaleString('en-IN')}) · UTR: ${paymentData.utrRef}`,
      by,
    });

    await mobileStorage.setWorkOrders(list);

    const vouchers = await mobileStorage.getVouchers();
    vouchers.unshift({
      id: 'vch-' + Date.now(),
      voucherNumber: 'VCH-WO-' + Date.now().toString().slice(-4),
      type: 'Payment Voucher',
      date: today,
      debitAccount: 'Subcontractor Payable Account',
      creditAccount: 'HDFC Corporate Operating Account',
      amount: netPayable,
      narration: `Payment for Work Order ${wo.woNumber} to ${wo.vendorName} - UTR: ${paymentData.utrRef}${paymentData.remarks ? ` (${paymentData.remarks})` : ''}`,
      referenceType: 'work_order',
      referenceId: wo.id,
    });
    await mobileStorage.setVouchers(vouchers);

    return wo;
  }

  // Documents & 4-Eyes Principle
  async getDocuments(): Promise<DocumentItem[]> {
    return mobileStorage.getDocuments();
  }

  // Four-Eyes Principle Safety Guard from report & prompt:
  // The uploader strictly MUST NOT be able to verify their own confidential document!
  async verifyDocument(docId: string, verifierId: string, verifierName: string, remarks: string): Promise<DocumentItem> {
    const docs = await mobileStorage.getDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found.');

    if (doc.uploadedBy === verifierId) {
      throw new Error('Four-Eyes Security Violation: The user who uploaded this document cannot verify it. Another officer must inspect and verify.');
    }

    doc.isVerified = true;
    doc.verifiedBy = verifierId;
    doc.verifierName = verifierName;
    doc.verificationRemarks = remarks;
    await mobileStorage.setDocuments(docs);
    return doc;
  }

  // Government Document Management (EDMS)
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

    // 4-EYES PRINCIPLE:
    // Uploader / filer cannot verify their own document!
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
      await this.discardScan(options.scanId);
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

    // Update letter.sharedOn in project if present
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

    // Synchronize to dispatches register
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

    // Update in dispatches register
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

  // Scan Inbox operations
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

    // Remove scan from inbox
    await this.discardScan(scanId);

    const updated = await this.getGovtDocuments();
    return updated.find((d) => d.id === newLetterId)!;
  }

  // Dispatches
  async getDispatches(): Promise<DispatchRecord[]> {
    return mobileStorage.getDispatches();
  }

  async logDispatch(data: Omit<DispatchRecord, 'id' | 'status'>): Promise<DispatchRecord> {
    const list = await mobileStorage.getDispatches();
    const newDisp: DispatchRecord = {
      ...data,
      id: 'disp-' + Date.now(),
      status: 'In Transit',
    };
    list.unshift(newDisp);
    await mobileStorage.setDispatches(list);
    return newDisp;
  }
}


export const crmService = new CrmService();
