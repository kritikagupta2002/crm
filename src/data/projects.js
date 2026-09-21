import { addDays, parseISODate, toISODate } from '../utils/date'
import { ONBOARDING_STEPS, progressOf } from '../utils/workflow'
import { LEADS, SERVICE_DETAILS, TODAY } from './mockData'

/*
 * Projects for won clients, derived from the lead (like quotations), so the generated leads and
 * dashboard numbers stay exactly as they are. Each project has work milestones, the government
 * approval it is heading for (with the authority's real name) and the official letters issued on
 * the way. Anything the team marks in the CRM is kept separately as edits and laid over the top.
 */

export const MILESTONES = [
  { key: 'kickoff', label: 'Kick-off & data collection', at: 0.08 },
  { key: 'field', label: 'Field survey & sampling', at: 0.35 },
  { key: 'analysis', label: 'Analysis & modelling', at: 0.6 },
  { key: 'report', label: 'Report preparation', at: 0.85 },
  { key: 'submission', label: 'Submission to authority', at: 1 },
]

/* The approval each service line works towards. Days count from the submission milestone. */
const APPROVALS = {
  'Mineral Exploration & Resources': {
    authority: (state) => `Department of Mines & Geology, ${state}`,
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Exploration report submitted', days: 0, letter: 'Acknowledgement of exploration report' },
      { key: 'scrutiny', label: 'Scrutiny by the Directorate', days: 24 },
      { key: 'granted', label: 'Geological report accepted', days: 52, letter: 'Acceptance of geological report' },
    ],
  },
  'Mineral Economics & Valuation': {
    authority: (state) => `Department of Mines & Geology, ${state}`,
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Valuation report submitted', days: 0, letter: 'Acknowledgement of valuation report' },
      { key: 'scrutiny', label: 'Clarifications answered', days: 20 },
      { key: 'granted', label: 'Valuation accepted', days: 40, letter: 'Acceptance of valuation' },
    ],
  },
  'Environment, Community & Permitting': {
    authority: () => 'SEIAA / MoEFCC (PARIVESH)',
    code: 'SEIAA',
    steps: [
      { key: 'filed', label: 'EC application filed on PARIVESH', days: 0, letter: 'Acknowledgement of EC application' },
      { key: 'hearing', label: 'Public hearing held', days: 30, letter: 'Minutes of public hearing' },
      { key: 'scrutiny', label: 'SEAC appraisal', days: 55 },
      { key: 'granted', label: 'Environmental Clearance granted', days: 80, letter: 'Environmental Clearance letter' },
    ],
  },
  'Mine Planning & Prefeasibility Study': {
    authority: () => 'Indian Bureau of Mines',
    code: 'IBM',
    steps: [
      { key: 'filed', label: 'Mining plan submitted', days: 0, letter: 'Acknowledgement of mining plan' },
      { key: 'inspection', label: 'IBM site inspection', days: 26, letter: 'Site inspection notice' },
      { key: 'granted', label: 'Mining plan approved', days: 58, letter: 'Mining plan approval letter' },
    ],
  },
  'Hydrogeology & Groundwater': {
    authority: () => 'Central Ground Water Authority',
    code: 'CGWA',
    steps: [
      { key: 'filed', label: 'NOC application filed', days: 0, letter: 'Acknowledgement of NOC application' },
      { key: 'inspection', label: 'Site inspection', days: 22 },
      { key: 'granted', label: 'Groundwater NOC issued', days: 46, letter: 'Groundwater abstraction NOC' },
    ],
  },
  'Remote Sensing, GIS & Aerial Mapping': {
    authority: (state) => `Department of Mines & Geology, ${state}`,
    code: 'DMG',
    steps: [
      { key: 'filed', label: 'Survey maps submitted', days: 0, letter: 'Acknowledgement of survey maps' },
      { key: 'inspection', label: 'DGPS pillar verification', days: 18 },
      { key: 'granted', label: 'Lease maps approved', days: 38, letter: 'Approval of lease boundary maps' },
    ],
  },
  'Geotechnical Services': {
    authority: () => 'Directorate General of Mines Safety',
    code: 'DGMS',
    steps: [
      { key: 'filed', label: 'Slope stability report submitted', days: 0, letter: 'Acknowledgement of report' },
      { key: 'scrutiny', label: 'DGMS review', days: 25 },
      { key: 'granted', label: 'Permission granted', days: 48, letter: 'Permission under Reg. 106' },
    ],
  },
}

const num = (lead) => Number(lead.id.split('-').pop()) || 1
const stateOfLead = (lead) => lead.location?.split(',').pop().trim() || 'Rajasthan'
const iso = (d) => toISODate(d)

/* When the deal was won: recorded in the app, else a stable date a few weeks after the enquiry. */
export function wonDate(lead) {
  if (lead.wonOn) return lead.wonOn
  const guess = addDays(parseISODate(lead.createdOn), 18 + (num(lead) % 15))
  return iso(new Date(Math.min(guess, addDays(TODAY, -3))))
}

function build({ id, lead, name, service, startedOn, days, n }) {
  const approval = APPROVALS[service] ?? APPROVALS['Mineral Exploration & Resources']
  const start = startedOn && parseISODate(startedOn)
  const milestones = MILESTONES.map((m) => ({ ...m, date: start ? iso(addDays(start, Math.round(days * m.at))) : null }))
  const submission = milestones[milestones.length - 1].date
  const steps = approval.steps.map((s) => ({ ...s, date: submission ? iso(addDays(parseISODate(submission), s.days)) : null }))
  return {
    id,
    leadId: lead.id,
    name,
    site: lead.location ?? stateOfLead(lead),
    startedOn,
    dueOn: submission,
    authority: approval.authority(stateOfLead(lead)),
    code: approval.code,
    refBase: `${approval.code}/${stateOfLead(lead).slice(0, 3).toUpperCase()}/${(startedOn ?? lead.createdOn).slice(0, 4)}/${1000 + ((n * 373) % 8999)}`,
    milestones,
    approvals: steps,
  }
}

/* The generated projects for a won lead: the one it was won for, and for some clients an earlier, finished one. */
export function baseProjects(lead) {
  if (lead.stage !== 'Won') return []
  const n = num(lead)
  const year = lead.createdOn.slice(2, 4)
  const onboarded = progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length
  const won = wonDate(lead)
  const projects = [
    build({
      id: `PR-${year}-${String(n).padStart(3, '0')}`,
      lead,
      name: lead.serviceDetail,
      service: lead.service,
      startedOn: onboarded ? iso(addDays(parseISODate(won), 10)) : null,
      days: 45 + ((n * 13) % 60),
      n,
    }),
  ]
  // Some of the demo's existing clients also have an earlier, finished project; a client won in the app is new.
  if (n % 3 === 0 && LEADS.some((l) => l.id === lead.id)) {
    const options = SERVICE_DETAILS[lead.service] ?? [lead.serviceDetail]
    const earlier = options.find((d) => d !== lead.serviceDetail) ?? lead.serviceDetail
    projects.push(
      build({
        id: `PR-${String(Number(year) - 1).padStart(2, '0')}-${String(n + 400).padStart(3, '0')}`,
        lead,
        name: earlier,
        service: lead.service,
        startedOn: iso(addDays(parseISODate(lead.createdOn), -320)),
        days: 90,
        n: n + 400,
      }),
    )
  }
  return projects
}
