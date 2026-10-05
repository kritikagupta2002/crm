import { mobileStorage } from '../../storage';
import { Lead, Client, Project } from '../../types';

export class LeadsService {
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

  async convertLead(id: string, gstin?: string, pan?: string): Promise<{ client: Client; project: Project }> {
    const leads = await mobileStorage.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error('Lead not found.');

    lead.stage = 'Won';
    await mobileStorage.setLeads(leads);

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
}

export const leadsService = new LeadsService();
