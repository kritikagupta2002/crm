import { mobileStorage } from '../../storage';
import {
  Project,
  ProjectStage,
  ProjectStageNumber,
  ProjectTeam,
  GovtLetter,
  FieldVisit,
  Task,
  Deliverable,
} from '../../types';
import {
  CLOSURE_STEPS,
  APPROVALS,
  MILESTONES,
} from '../../constants';

export class ProjectsService {
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

    if (proj.currentStage === 1 && proj.team.coordinator) {
      proj.currentStage = 2;
      proj.stageIndex = 1;
      proj.stageName = 'Stage 2: Planning';
      if (proj.stages?.[0]) proj.stages[0].status = 'Completed';
      if (proj.stages?.[1]) proj.stages[1].status = 'In Progress';
    }
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

    if (proj.milestones) {
      const subMs = proj.milestones.find((m) => m.key === 'submission');
      if (subMs) {
        subMs.done = true;
        subMs.date = data.date;
      }
    }

    if (proj.approvals && proj.approvals.length > 0) {
      proj.approvals[0].done = true;
      proj.approvals[0].date = data.date;
    }

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

  async approveDeliverable(projectId: string, deliverableId: string, remarks?: string): Promise<{ project: Project; deliverable: Deliverable }> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const deliv = (proj.deliverables || []).find((d) => d.id === deliverableId);
    if (!deliv) throw new Error('Deliverable not found.');

    deliv.status = 'Client Approved';

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'milestone',
      date: new Date().toISOString().split('T')[0],
      text: `Technical deliverable "${deliv.title}" signed off by Client${remarks ? ` (${remarks})` : ''}`,
    });

    // Check if project is in Stage 5 (Client Approval) and all deliverables are now approved
    if (proj.currentStage === 5) {
      const unapproved = (proj.deliverables || []).filter((d) => d.status !== 'Client Approved');
      if (unapproved.length === 0) {
        if (proj.stages && proj.stages[4]) {
          proj.stages[4].status = 'Completed';
          proj.stages[4].completedAt = new Date().toISOString().split('T')[0];
        }
        proj.currentStage = 6;
        proj.stageIndex = 5;
        proj.stageName = 'Stage 6: Invoicing';
        if (proj.stages && proj.stages[5]) {
          proj.stages[5].status = 'In Progress';
        }
        proj.history.unshift({
          id: 'h-' + (Date.now() + 1),
          kind: 'milestone',
          date: new Date().toISOString().split('T')[0],
          text: 'Stage 5 Client Approval completed. Project transitioned to Stage 6: Invoicing.',
        });
      }
    }

    await mobileStorage.setProjects(projects);
    return { project: proj, deliverable: deliv };
  }

  async rejectDeliverable(projectId: string, deliverableId: string, reason: string): Promise<{ project: Project; deliverable: Deliverable }> {
    const projects = await mobileStorage.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const deliv = (proj.deliverables || []).find((d) => d.id === deliverableId);
    if (!deliv) throw new Error('Deliverable not found.');

    deliv.status = 'Revision Requested';

    if (!proj.history) proj.history = [];
    proj.history.unshift({
      id: 'h-' + Date.now(),
      kind: 'letter',
      date: new Date().toISOString().split('T')[0],
      text: `Client requested revision on "${deliv.title}": ${reason}`,
    });

    await mobileStorage.setProjects(projects);
    return { project: proj, deliverable: deliv };
  }
}

export const projectsService = new ProjectsService();
