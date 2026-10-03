import { TeamRole } from '../types';

export interface ErmStageConfig {
  key: string;
  label: string;
  owner: string;
  todo: string;
  waiting: string;
}

export const ERM_STAGES: ErmStageConfig[] = [
  { key: 'allocation', label: 'Allocation', owner: 'Admin', todo: 'Assign a project coordinator', waiting: 'Waiting for a coordinator' },
  { key: 'planning', label: 'Planning', owner: 'Team Lead', todo: 'Choose the team lead and field team', waiting: 'Waiting for a team' },
  { key: 'tasks', label: 'Task assignment', owner: 'Team Lead', todo: 'Give every task an owner', waiting: 'Tasks waiting for owners' },
  { key: 'work', label: 'Field & report work', owner: 'Field team', todo: 'Finish the field work and the report', waiting: 'Survey or report under way' },
  { key: 'submission', label: 'Govt submission', owner: 'Team Lead', todo: 'Submit to the authority', waiting: 'Report ready, to be filed' },
  { key: 'approval', label: 'Final approval', owner: 'Authority', todo: 'Follow up for the approval', waiting: 'Filed, waiting for approval' },
  { key: 'closure', label: 'Project closure', owner: 'Team Lead', todo: 'Hand over and close the project', waiting: 'Approved, to be handed over' },
];

export const CLOSURE_STEPS = [
  { key: 'handover', label: 'Final report and approval handed over to the client' },
  { key: 'payment', label: 'Final payment received' },
  { key: 'archive', label: 'Field data and documents archived' },
  { key: 'feedback', label: 'Client feedback taken' },
];

export const STAGE_ACTORS: Record<string, string[]> = {
  allocation: ['admin', 'director'],
  planning: ['admin', 'director', 'lead'],
  tasks: ['admin', 'director', 'lead'],
  work: ['admin', 'director', 'lead', 'employee'],
  submission: ['admin', 'director', 'lead'],
  approval: ['admin', 'director', 'lead'],
  closure: ['admin', 'director', 'lead'],
};

export const canActOnErm = (role: TeamRole | string, stageKey: string): boolean => {
  const normRole = (role || '').toLowerCase();
  const actors = STAGE_ACTORS[stageKey] || ['admin'];
  return actors.includes(normRole) || normRole === 'admin';
};

export const COORDINATORS = [
  { name: 'A. Singh', title: 'Project Coordinator' },
  { name: 'N. Rathore', title: 'Project Coordinator' },
  { name: 'Kritika Gupta', title: 'Senior Project Coordinator' },
];

export const TEAM_LEADS = [
  { name: 'Dr. Sunita Meena', title: 'Senior Geologist', services: ['Mineral Exploration & Resources', 'Mineral Economics & Valuation'] },
  { name: 'R. Bhati', title: 'Hydrogeologist', services: ['Hydrogeology & Groundwater', 'Geotechnical Services'] },
  { name: 'S. Choudhary', title: 'Mining Engineer', services: ['Mine Planning & Prefeasibility Study', 'Remote Sensing, GIS & Aerial Mapping'] },
  { name: 'M. Khan', title: 'Environment Specialist', services: ['Environment, Community & Permitting'] },
];

export const FIELD_MEMBERS = [
  { name: 'Ajay Kumar', title: 'Field Geologist', skills: 'Mapping, sampling', phone: '9829022101' },
  { name: 'Deepak Soni', title: 'Surveyor', skills: 'DGPS, total station', phone: '9829022102' },
  { name: 'Ravi Gurjar', title: 'Drone Operator', skills: 'Aerial survey, GIS', phone: '9829022103' },
  { name: 'Imran Ali', title: 'Field Technician', skills: 'Drilling logs, core sampling', phone: '9829022104' },
  { name: 'Sunil Yadav', title: 'Field Technician', skills: 'Water level, pumping tests', phone: '9829022105' },
  { name: 'Pooja Meena', title: 'Environment Surveyor', skills: 'Air, water & noise monitoring', phone: '9829022106' },
];

export const titleOf = (name: string): string => {
  const all = [...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS];
  return all.find((p) => p.name === name)?.title ?? '';
};

export const MILESTONES = [
  { key: 'kickoff', label: 'Kick-off & data collection', at: 0.08 },
  { key: 'field', label: 'Field survey & sampling', at: 0.35 },
  { key: 'analysis', label: 'Analysis & modelling', at: 0.6 },
  { key: 'report', label: 'Report preparation', at: 0.85 },
  { key: 'submission', label: 'Submission to authority', at: 1 },
];

export const APPROVALS: Record<string, { authority: string; code: string; steps: Array<{ key: string; label: string; days: number; letter?: string }> }> = {
  'Mineral Exploration & Resources': {
    authority: 'Department of Mines & Geology, Rajasthan',
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Exploration report submitted', days: 0, letter: 'Acknowledgement of exploration report' },
      { key: 'scrutiny', label: 'Scrutiny by the Directorate', days: 24 },
      { key: 'granted', label: 'Geological report accepted', days: 52, letter: 'Acceptance of geological report' },
    ],
  },
  'Environment, Community & Permitting': {
    authority: 'SEIAA / MoEFCC (PARIVESH)',
    code: 'SEIAA',
    steps: [
      { key: 'filed', label: 'EC application filed on PARIVESH', days: 0, letter: 'Acknowledgement of EC application' },
      { key: 'hearing', label: 'Public hearing held', days: 30, letter: 'Minutes of public hearing' },
      { key: 'scrutiny', label: 'SEAC appraisal', days: 55 },
      { key: 'granted', label: 'Environmental Clearance granted', days: 80, letter: 'Environmental Clearance letter' },
    ],
  },
  'Mine Planning & Prefeasibility Study': {
    authority: 'Indian Bureau of Mines',
    code: 'IBM',
    steps: [
      { key: 'filed', label: 'Mining plan submitted', days: 0, letter: 'Acknowledgement of mining plan' },
      { key: 'inspection', label: 'IBM site inspection', days: 26, letter: 'Site inspection notice' },
      { key: 'granted', label: 'Mining plan approved', days: 58, letter: 'Mining plan approval letter' },
    ],
  },
  'Hydrogeology & Groundwater': {
    authority: 'Central Ground Water Authority',
    code: 'CGWA',
    steps: [
      { key: 'filed', label: 'NOC application filed', days: 0, letter: 'Acknowledgement of NOC application' },
      { key: 'inspection', label: 'Site inspection', days: 22 },
      { key: 'granted', label: 'Groundwater NOC issued', days: 46, letter: 'Groundwater abstraction NOC' },
    ],
  },
  'Remote Sensing, GIS & Aerial Mapping': {
    authority: 'Department of Mines & Geology, Rajasthan',
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Survey maps submitted', days: 0, letter: 'Acknowledgement of survey maps' },
      { key: 'inspection', label: 'DGPS pillar verification', days: 18 },
      { key: 'granted', label: 'Lease maps approved', days: 38, letter: 'Approval of lease boundary maps' },
    ],
  },
  'Geotechnical Services': {
    authority: 'Directorate General of Mines Safety',
    code: 'DGMS',
    steps: [
      { key: 'filed', label: 'Slope stability report submitted', days: 0, letter: 'Acknowledgement of report' },
      { key: 'scrutiny', label: 'DGMS review', days: 25 },
      { key: 'granted', label: 'Permission granted', days: 48, letter: 'Permission under Reg. 106' },
    ],
  },
  'Mineral Economics & Valuation': {
    authority: 'Department of Mines & Geology, Rajasthan',
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Valuation report submitted', days: 0, letter: 'Acknowledgement of valuation report' },
      { key: 'scrutiny', label: 'Clarifications answered', days: 20 },
      { key: 'granted', label: 'Valuation accepted', days: 40, letter: 'Acceptance of valuation' },
    ],
  },
};

export const SUBMISSION_MODES = [
  'PARIVESH portal',
  'NOCAP portal (CGWA)',
  'IBM online portal',
  'By hand at the office',
  'Speed post',
];

export const DOC_CATEGORIES = ['Report', 'Field data', 'Maps & drawings', 'Submission', 'Other'];

export const WORK_SUGGESTIONS = [
  'Geological mapping',
  'Sample collection',
  'Core drilling & logging',
  'DGPS pillar survey',
  'Drone flight & GCP marking',
  'Water level survey of wells',
  'Pumping test',
  'Baseline air & water sampling',
  'Slope face mapping',
  'Site inspection',
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
  Todo: 'To do',
  'In Progress': 'In progress',
  'Under Review': 'Under review',
  Completed: 'Done',
};
