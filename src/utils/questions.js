import { queriesOf } from '../data/queries'
import { clientProjects } from './projects'

/*
 * Who answers a question the client asked on the portal, by its topic: money goes to Accounts; the work and its
 * papers go to the project team once the deal is won (to Sales before that); anything else to Sales. The Admin
 * can answer all of them; Management reads them.
 */
export function questionRoles(lead, topic) {
  const won = lead.stage === 'Won'
  if (topic === 'Billing') return ['Admin', 'Finance', 'Accountant']
  if (topic === 'Project') return won ? ['Admin', 'Project Coordinator', 'Team Lead'] : ['Admin', 'Sales']
  if (topic === 'Documents') return won ? ['Admin', 'Project Coordinator'] : ['Admin', 'Sales']
  return won ? ['Admin', 'Sales', 'Project Coordinator'] : ['Admin', 'Sales']
}

/* Who it is waiting for, in words. */
export function answeredByLabel(lead, topic) {
  if (topic === 'Billing') return 'Accounts'
  if (lead.stage !== 'Won' || topic === 'Other') return 'Sales'
  return topic === 'Project' ? 'the project team' : 'the Project Coordinator'
}

/* Whether this person can answer: a team lead only for projects they lead. */
export function canAnswer({ role, userName, projectEdits }, lead, topic) {
  if (!questionRoles(lead, topic).includes(role)) return false
  return role !== 'Team Lead' || clientProjects(lead, projectEdits).some((p) => p.team.teamLead === userName)
}

/* Every portal question with its client, newest first. */
export const allQuestions = (leads) =>
  leads
    .flatMap((lead) => queriesOf(lead).map((q) => ({ ...q, lead })))
    .sort((a, b) => b.at.localeCompare(a.at))

/* The questions a person looks after: all of them for the Admin and Management, else the ones they can answer. */
export const questionsFor = (who, leads) => allQuestions(leads).filter((q) => who.role === 'Admin' || who.role === 'Management' || canAnswer(who, q.lead, q.topic))
