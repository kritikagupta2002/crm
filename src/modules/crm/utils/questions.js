import { queriesOf } from '../data/queries'

/*
 * Who answers a question the client asked on the portal, by its topic: money goes to Accounts; the work and its
 * papers go to the project team once the deal is won (to Sales before that); anything else to Sales. The Admin
 * can answer all of them.
 */
export function questionRoles(lead, topic) {
  const won = lead.stage === 'Won'
  if (topic === 'Billing') return ['Super Admin', 'Finance Master', 'Accounts Executive']
  if (topic === 'Project' || topic === 'Documents') return won ? ['Super Admin', 'Director', 'Manager', 'Finance Master'] : ['Super Admin', 'Director', 'Finance Master']
  return won ? ['Super Admin', 'Director', 'Manager', 'Finance Master'] : ['Super Admin', 'Director', 'Finance Master']
}

/* Who it is waiting for, in words. */
export function answeredByLabel(lead, topic) {
  if (topic === 'Billing') return 'Accounts'
  if (lead.stage !== 'Won' || topic === 'Other') return 'the sales team'
  return topic === 'Project' ? 'the project team' : 'the Manager'
}

/* Whether this person's role answers it. */
export const canAnswer = ({ role }, lead, topic) => questionRoles(lead, topic).includes(role)

/* Every portal question with its client, newest first. */
export const allQuestions = (leads) =>
  leads
    .flatMap((lead) => queriesOf(lead).map((q) => ({ ...q, lead })))
    .sort((a, b) => b.at.localeCompare(a.at))

/* The questions a person looks after: all of them for the Admin, else the ones their role answers. */
export const questionsFor = (who, leads) => allQuestions(leads).filter((q) => ['Super Admin', 'Finance Master'].includes(who.role) || canAnswer(who, q.lead, q.topic))
