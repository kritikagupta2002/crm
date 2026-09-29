import { addDays, parseISODate, toISODate } from '../utils/date'
import { ONBOARDING_STEPS, progressOf, seededWonOn } from '../utils/workflow'
import { LEADS, SERVICE_DETAILS, TODAY } from './mockData'
import { COORDINATORS, FIELD_MEMBERS, teamLeadFor } from './staff'
import { SUBCONTRACT_BY_SERVICE, VENDORS } from './vendors'

export const MILESTONES = [
  { key: 'kickoff', label: 'Kick-off & data collection', at: 0.08 },
  { key: 'field', label: 'Field survey & sampling', at: 0.35 },
  { key: 'analysis', label: 'Analysis & modelling', at: 0.6 },
  { key: 'report', label: 'Report preparation', at: 0.85 },
  { key: 'submission', label: 'Submission to authority', at: 1 },
]

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

const FIELD_BY_SERVICE = {
  'Environment, Community & Permitting': ['Pooja Meena', 'Ajay Kumar'],
  'Hydrogeology & Groundwater': ['Sunil Yadav', 'Imran Ali'],
  'Remote Sensing, GIS & Aerial Mapping': ['Ravi Gurjar', 'Deepak Soni'],
  'Geotechnical Services': ['Imran Ali', 'Deepak Soni'],
  'Mine Planning & Prefeasibility Study': ['Deepak Soni', 'Ajay Kumar'],
}

function teamFor(service, n) {
  const pair = FIELD_BY_SERVICE[service] ?? [FIELD_MEMBERS[n % FIELD_MEMBERS.length].name, FIELD_MEMBERS[(n + 3) % FIELD_MEMBERS.length].name]
  return { coordinator: COORDINATORS[n % COORDINATORS.length].name, teamLead: teamLeadFor(service, n).name, members: pair }
}

const FIELD_WORK = {
  'Mineral Exploration & Resources': ['Geological mapping', 'Core drilling & logging', 'Sample collection'],
  'Mineral Economics & Valuation': ['Site inspection & reserve check', 'Pit measurement'],
  'Environment, Community & Permitting': ['Baseline air & water sampling', 'Noise & dust monitoring', 'Community survey'],
  'Mine Planning & Prefeasibility Study': ['Pit & bench survey', 'Drone survey of the lease', 'Sample collection'],
  'Hydrogeology & Groundwater': ['Water level survey of wells', 'Pumping test', 'Water sample collection'],
  'Remote Sensing, GIS & Aerial Mapping': ['Drone flight & GCP marking', 'DGPS pillar survey'],
  'Geotechnical Services': ['Slope face mapping', 'Rock sample collection', 'Bench survey'],
}

export const SUBMISSION_MODES = ['PARIVESH portal', 'NOCAP portal (CGWA)', 'IBM online portal', 'By hand at the office', 'Speed post']
const MODE_BY_CODE = { SEIAA: 'PARIVESH portal', CGWA: 'NOCAP portal (CGWA)', IBM: 'IBM online portal', DMG: 'By hand at the office', DGMS: 'By hand at the office' }

const CLOSURE_LAG = { handover: 3, payment: 10, archive: 20, feedback: 35 }

const slug = (text) => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
const SITE_STEPS = ['inspection', 'hearing']

function seededFieldTasks({ id, team, submission, steps, n }) {
  const today = iso(TODAY)
  if (!team.members?.length || !submission) return []
  if (submission <= today) {
    return steps
      .filter((s) => SITE_STEPS.includes(s.key) && s.date > today)
      .map((s, i) => ({
        id: `${id}-FT-${s.key}`,
        title: `${s.key === 'hearing' ? 'Public hearing' : s.label}: be on site with the maps and field data`,
        assignee: team.members[(n + i) % team.members.length],
        due: iso(addDays(parseISODate(s.date), -1)),
        status: 'todo',
        doneOn: null,
      }))
  }
  const who = team.members[team.members.length - 1]
  return [
    { id: `${id}-FT1`, title: 'Site photographs & final measurements for the report', assignee: who, due: iso(addDays(TODAY, 2 + (n % 4))), status: n % 2 ? 'in-progress' : 'todo', doneOn: null },
    { id: `${id}-FT2`, title: 'Collect check samples from the last pit', assignee: team.members[0], due: iso(addDays(TODAY, 5 + (n % 3))), status: 'todo', doneOn: null },
  ]
}

function seededWorkOrders({ id, service, start, days, n }) {
  if (!start) return []
  const job = SUBCONTRACT_BY_SERVICE[service]
  if (!job) return []
  const today = iso(TODAY)
  const issuedOn = iso(addDays(start, Math.round(days * 0.1)))
  if (issuedOn > today) return []
  const dueOn = iso(addDays(start, Math.round(days * 0.4)))
  const status = iso(addDays(parseISODate(dueOn), 25)) <= today ? 'Paid' : iso(addDays(parseISODate(dueOn), 6)) <= today ? 'Bill received' : dueOn <= today ? 'Completed' : 'In progress'
  const amount = Math.round((job.amount * (0.85 + ((n * 37) % 30) / 100)) / 1000) * 1000
  const orderId = `SC-${id.slice(3)}-1`
  const vendor = VENDORS.find((v) => v.name === job.vendor)
  const at = (days, from = dueOn) => {
    const d = iso(addDays(parseISODate(from), days))
    return d > today ? today : d
  }
  const order = { id: orderId, vendor: job.vendor, work: job.work, amount, issuedOn, dueOn, startedOn: at(2, issuedOn) }
  if (status === 'In progress') return [order]
  const late = n % 4 === 0
  order.delivery = { on: at(late ? 4 : -2), note: `${job.work} completed; report and raw data handed over.`, files: [{ id: `${orderId}-DLV`, name: `${orderId}_${slug(job.vendor)}_report.pdf`, size: 2_400_000 + ((n * 811) % 3_000_000), type: 'application/pdf' }], by: vendor?.contact ?? job.vendor }
  if (status === 'Completed') return [order]
  const waiting = status === 'Bill received'
  const billAmount = waiting && n % 2 === 1 ? amount + Math.round(amount * 0.04) : amount
  order.bill = { no: `INV/${vendor?.id ?? 'VN'}/${(n * 7) % 300 + 100}`, date: at(5, order.delivery.on), amount: billAmount, file: { id: `${orderId}-BILL`, name: `${orderId}_invoice.pdf`, size: 310_000 + ((n * 97) % 200_000), type: 'application/pdf' }, by: vendor?.contact ?? job.vendor }
  if (waiting && n % 3 === 0 && billAmount === amount) order.check = { on: at(2, order.bill.date), ok: true, by: 'N. Jain' }
  if (waiting) return [order]
  const tds = vendor?.tds ?? { section: '194C', rate: 2 }
  order.check = { on: at(2, order.bill.date), ok: true, by: 'N. Jain' }
  order.payment = { on: at(25), gross: Math.round(amount * 1.18), tds: { ...tds, amount: Math.round((amount * tds.rate) / 100) }, ref: `NEFT${String(100000 + n * 4271).slice(0, 6)}`, by: 'Chhavi Bansal' }
  return [order]
}

const stateOfLead = (lead) => lead.location?.split(',').pop().trim() || 'Rajasthan'
const iso = (d) => toISODate(d)

export const wonDate = (lead) => lead.wonOn ?? seededWonOn(lead)

function build({ id, lead, name, service, startedOn, days, n, team, site, createdOn, extra = false }) {
  const approval = APPROVALS[service] ?? APPROVALS['Mineral Exploration & Resources']
  const start = startedOn && parseISODate(startedOn)
  const milestones = MILESTONES.map((m) => ({ ...m, date: start ? iso(addDays(start, Math.round(days * m.at))) : null }))
  const submission = milestones[milestones.length - 1].date
  const steps = approval.steps.map((s) => ({ ...s, date: submission ? iso(addDays(parseISODate(submission), s.days)) : null }))
  const place = site ?? lead.location ?? stateOfLead(lead)
  const refBase = `${approval.code}/${stateOfLead(lead).slice(0, 3).toUpperCase()}/${(startedOn ?? lead.createdOn).slice(0, 4)}/${1000 + ((n * 373) % 8999)}`
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
    extra,
    fieldVisits: seededVisits({ id, service, start, days, team, site: place, n }),
    workOrders: seededWorkOrders({ id, service, start, days, n }),
    seedTasks: seededFieldTasks({ id, team, submission, steps, n }),
    reportFile: { id: `${id}-RPT`, name: `${slug(name)}_final_report.pdf`, size: 6_800_000 + ((n * 4513) % 2_400_000), type: 'application/pdf', category: 'Report', seeded: true },
    submissionInfo: { mode: MODE_BY_CODE[approval.code], ackNo: `${refBase}/ACK`, files: [{ id: `${id}-SUB`, name: `${slug(name)}_submission.pdf`, size: 4_200_000 + ((n * 977) % 1_500_000), type: 'application/pdf' }] },
    closureSeed,
  }
}

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
      createdOn: won,
    }),
  ]
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
        extra: true,
      }),
    )
  })
  return projects
}
