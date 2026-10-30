import type { CanonicalRole } from '../types';

/*
 * Questions clients ask from the portal, kept on the enquiry as `queries`, and who answers them, as on
 * the web: money goes to Accounts; the work and its papers go to the project team once the deal is won
 * (to Sales before that); anything else to Sales. The Super Admin and Finance Master see all of them.
 */
export const QUERY_TOPICS = ['Project', 'Documents', 'Billing', 'Other'] as const;
export type QueryTopic = (typeof QUERY_TOPICS)[number];

export interface ClientQuery {
  id: string;
  topic: QueryTopic;
  message: string;
  at: string;
  status: 'Open' | 'Answered';
  reply?: string;
  repliedAt?: string;
  repliedBy?: string;
}

const daysAgo = (n: number, time: string) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.toISOString().slice(0, 10)}T${time}:00.000Z`;
};

/* The demo's questions: one answered and some still open, so both sides show. */
const SEEDED: Record<string, ClientQuery[]> = {
  'lead-006': [
    {
      id: 'Q-006-1',
      topic: 'Documents',
      message: 'Can you share the acceptance letter from DMG? Our bank has asked for a copy.',
      at: daysAgo(30, '05:10'),
      status: 'Answered',
      reply: 'It is now under Documents in your portal. Download it any time.',
      repliedAt: daysAgo(30, '08:40'),
      repliedBy: 'Kritika Gupta',
    },
    {
      id: 'Q-006-2',
      topic: 'Billing',
      message: 'Please send the GST invoice for the advance. Our accounts team needs it for this month’s return.',
      at: daysAgo(0, '04:40'),
      status: 'Open',
    },
  ],
  'lead-005': [
    {
      id: 'Q-005-1',
      topic: 'Project',
      message: 'When can the field team visit the site? We need to plan the site access.',
      at: daysAgo(1, '06:25'),
      status: 'Open',
    },
  ],
  'lead-004': [
    {
      id: 'Q-004-1',
      topic: 'Documents',
      message: 'Which lease papers do you still need from us: the lease deed and the khasra map, or anything else?',
      at: daysAgo(2, '09:15'),
      status: 'Open',
    },
  ],
};

export const queriesOf = (lead: any): ClientQuery[] => (lead?.queries as ClientQuery[]) ?? SEEDED[lead?.id] ?? [];

export function questionRoles(lead: any, topic: string): CanonicalRole[] {
  const won = lead?.stage === 'Won';
  if (topic === 'Billing') return ['super_admin', 'finance_master', 'accounts_executive'];
  return won ? ['super_admin', 'director', 'manager', 'finance_master'] : ['super_admin', 'director', 'finance_master'];
}

/* Who it is waiting for, in words. */
export function answeredByLabel(lead: any, topic: string) {
  if (topic === 'Billing') return 'Accounts';
  if (lead?.stage !== 'Won' || topic === 'Other') return 'the sales team';
  return topic === 'Project' ? 'the project team' : 'the Manager';
}

export const canAnswer = (role: CanonicalRole, lead: any, topic: string) => questionRoles(lead, topic).includes(role);

/* Every question with its client, newest first. */
export const allQuestions = (leads: any[]) =>
  leads.flatMap((lead) => queriesOf(lead).map((q) => ({ ...q, lead }))).sort((a, b) => b.at.localeCompare(a.at));

/* The questions a person looks after. */
export const questionsFor = (role: CanonicalRole, leads: any[]) =>
  allQuestions(leads).filter((q) => role === 'super_admin' || role === 'finance_master' || canAnswer(role, q.lead, q.topic));
