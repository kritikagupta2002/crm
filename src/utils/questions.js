import { queriesOf } from '../data/queries'

export function questionRoles(lead, topic) {
  const won = lead.stage === 'Won'
  if (topic === 'Billing') return ['Admin', 'Accountant']
  if (topic === 'Project' || topic === 'Documents') return won ? ['Admin', 'Team Lead'] : ['Admin', 'Employee']
  return won ? ['Admin', 'Employee', 'Team Lead'] : ['Admin', 'Employee']
}

export function answeredByLabel(lead, topic) {
  if (topic === 'Billing') return 'Accounts'
  if (lead.stage !== 'Won' || topic === 'Other') return 'the sales team'
  return topic === 'Project' ? 'the project team' : 'the Team Lead'
}

export const canAnswer = ({ role }, lead, topic) => questionRoles(lead, topic).includes(role)

export const allQuestions = (leads) =>
  leads
    .flatMap((lead) => queriesOf(lead).map((q) => ({ ...q, lead })))
    .sort((a, b) => b.at.localeCompare(a.at))

export const questionsFor = (who, leads) => allQuestions(leads).filter((q) => who.role === 'Admin' || canAnswer(who, q.lead, q.topic))
