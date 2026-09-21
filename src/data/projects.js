import { addDays, parseISODate, toISODate } from '../utils/date'
import { ONBOARDING_STEPS, progressOf } from '../utils/workflow'
import { LEADS, SERVICE_DETAILS, TODAY } from './mockData'
import { COORDINATORS, FIELD_MEMBERS, teamLeadFor } from './staff'

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

/* Field members whose skills suit the service line; the rest of the pool fills in. */
const FIELD_BY_SERVICE = {
  'Environment, Community & Permitting': ['Pooja Meena', 'Ajay Kumar'],
  'Hydrogeology & Groundwater': ['Sunil Yadav', 'Imran Ali'],
  'Remote Sensing, GIS & Aerial Mapping': ['Ravi Gurjar', 'Deepak Soni'],
  'Geotechnical Services': ['Imran Ali', 'Deepak Soni'],
  'Mine Planning & Prefeasibility Study': ['Deepak Soni', 'Ajay Kumar'],
}

/* The team a running project was given. A project that hasn't started yet has none: the Admin allocates it. */
function teamFor(service, n) {
  const pair = FIELD_BY_SERVICE[service] ?? [FIELD_MEMBERS[n % FIELD_MEMBERS.length].name, FIELD_MEMBERS[(n + 3) % FIELD_MEMBERS.length].name]
  return { coordinator: COORDINATORS[n % COORDINATORS.length].name, teamLead: teamLeadFor(service, n).name, members: pair }
}

/* What the field team does on site for each service line; seeded visits use these. */
const FIELD_WORK = {
  'Mineral Exploration & Resources': ['Geological mapping', 'Core drilling & logging', 'Sample collection'],
  'Mineral Economics & Valuation': ['Site inspection & reserve check', 'Pit measurement'],
  'Environment, Community & Permitting': ['Baseline air & water sampling', 'Noise & dust monitoring', 'Community survey'],
  'Mine Planning & Prefeasibility Study': ['Pit & bench survey', 'Drone survey of the lease', 'Sample collection'],
  'Hydrogeology & Groundwater': ['Water level survey of wells', 'Pumping test', 'Water sample collection'],
  'Remote Sensing, GIS & Aerial Mapping': ['Drone flight & GCP marking', 'DGPS pillar survey'],
  'Geotechnical Services': ['Slope face mapping', 'Rock sample collection', 'Bench survey'],
}

/* How a submission reaches each authority. */
export const SUBMISSION_MODES = ['PARIVESH portal', 'NOCAP portal (CGWA)', 'IBM online portal', 'By hand at the office', 'Speed post']
const MODE_BY_CODE = { SEIAA: 'PARIVESH portal', CGWA: 'NOCAP portal (CGWA)', IBM: 'IBM online portal', DMG: 'By hand at the office', DGMS: 'By hand at the office' }

/* Days after the final approval that each closure step was done on, for the demo's finished projects. */
const CLOSURE_LAG = { handover: 3, payment: 10, archive: 20, feedback: 35 }

const slug = (text) => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* Visits the field team has logged so far on a running project: photos and readings from each. */
function seededVisits({ id, service, start, days, team, site, n }) {
  if (!start || !team.members?.length) return []
  const work = FIELD_WORK[service] ?? FIELD_WORK['Mineral Exploration & Resources']
  const today = iso(TODAY)
  return [0.14, 0.22, 0.3]
    .map((at, i) => ({ at, i, date: iso(addDays(start, Math.round(days * at))) }))
    .filter(({ date }) => date <= today)
    .map(({ i, date }) => {
      const activity = work[i % work.length]
      const point = `${site.split(',')[0]} · ${['north block', 'pit 2', 'south boundary'][i]}`
      return {
        id: `${id}-FV${i + 1}`,
        date,
        by: team.members[i % team.members.length],
        activity,
        location: point,
        notes: [`${activity} completed as planned.`, 'Weather clear; access road usable.', 'Readings cross-checked with the team lead.'][(n + i) % 3],
        files: [
          { id: `${id}-FV${i + 1}-a`, name: `${slug(activity)}_${date}_photos.jpg`, size: 2_400_000 + ((n * 7919 + i * 131) % 900_000), type: 'image/jpeg' },
          { id: `${id}-FV${i + 1}-b`, name: `${slug(activity)}_${date}_readings.csv`, size: 18_000 + ((n * 31 + i) % 9000), type: 'text/csv' },
        ],
      }
    })
}
const stateOfLead = (lead) => lead.location?.split(',').pop().trim() || 'Rajasthan'
const iso = (d) => toISODate(d)

/* When the deal was won: recorded in the app, else a stable date a few weeks after the enquiry. */
export function wonDate(lead) {
  if (lead.wonOn) return lead.wonOn
  const guess = addDays(parseISODate(lead.createdOn), 18 + (num(lead) % 15))
  return iso(new Date(Math.min(guess, addDays(TODAY, -3))))
}

function build({ id, lead, name, service, startedOn, days, n, team, site, createdOn }) {
  const approval = APPROVALS[service] ?? APPROVALS['Mineral Exploration & Resources']
  const start = startedOn && parseISODate(startedOn)
  const milestones = MILESTONES.map((m) => ({ ...m, date: start ? iso(addDays(start, Math.round(days * m.at))) : null }))
  const submission = milestones[milestones.length - 1].date
  const steps = approval.steps.map((s) => ({ ...s, date: submission ? iso(addDays(parseISODate(submission), s.days)) : null }))
  const place = site ?? lead.location ?? stateOfLead(lead)
  const refBase = `${approval.code}/${stateOfLead(lead).slice(0, 3).toUpperCase()}/${(startedOn ?? lead.createdOn).slice(0, 4)}/${1000 + ((n * 373) % 8999)}`
  // After the final approval: report handed over, payment in, files archived, feedback taken, then closed.
  const lastApproval = steps[steps.length - 1]?.date
  const after = (d) => lastApproval && iso(addDays(parseISODate(lastApproval), d))
  const closureSeed = lastApproval && {
    steps: Object.fromEntries(Object.entries(CLOSURE_LAG).filter(([, d]) => after(d) <= iso(TODAY)).map(([key, d]) => [key, after(d)])),
    closedOn: after(40) <= iso(TODAY) ? after(40) : null,
  }
  return {
    id,
    leadId: lead.id,
    name,
    service,
    site: place,
    startedOn,
    dueOn: submission,
    authority: approval.authority(stateOfLead(lead)),
    code: approval.code,
    refBase,
    milestones,
    approvals: steps,
    team,
    createdOn: createdOn ?? null,
    fieldVisits: seededVisits({ id, service, start, days, team, site: place, n }),
    // How the submission was filed; used once the submission milestone is done.
    submissionInfo: { mode: MODE_BY_CODE[approval.code], ackNo: `${refBase}/ACK`, files: [{ id: `${id}-SUB`, name: `${slug(name)}_submission.pdf`, size: 4_200_000 + ((n * 977) % 1_500_000), type: 'application/pdf' }] },
    closureSeed,
  }
}

/* The generated projects for a won lead: the one it was won for, and for some clients an earlier, finished one. */
export function baseProjects(lead) {
  if (lead.stage !== 'Won') return []
  const n = num(lead)
  const year = lead.createdOn.slice(2, 4)
  const onboarded = progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length
  const won = wonDate(lead)
  const startedOn = onboarded ? iso(addDays(parseISODate(won), 10)) : null
  const projects = [
    build({
      id: `PR-${year}-${String(n).padStart(3, '0')}`,
      lead,
      name: lead.serviceDetail,
      service: lead.service,
      startedOn,
      days: 45 + ((n * 13) % 60),
      n,
      team: startedOn && startedOn <= iso(TODAY) ? teamFor(lead.service, n) : { coordinator: null, teamLead: null, members: [] },
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
        team: teamFor(lead.service, n + 1),
      }),
    )
  }
  // Repeat work for the same client, created in the ERM ("New project").
  ;(lead.extraProjects ?? []).forEach((p) => {
    projects.push(
      build({
        id: p.id,
        lead,
        name: p.name,
        service: p.service,
        startedOn: p.startedOn,
        days: p.days,
        n: Number(p.id.split('-').pop()) || n,
        team: { coordinator: null, teamLead: null, members: [] },
        site: p.site,
        createdOn: p.createdOn,
      }),
    )
  })
  return projects
}
