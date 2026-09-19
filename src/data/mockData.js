import { addDays, toISODate } from '../utils/date'

/*
 * Demo data is generated from a fixed seed so every refresh shows the same records,
 * and dates are anchored to "today" so the demo never looks stale.
 * Every number on the dashboard is derived from these arrays, so totals always agree.
 */

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(20260919)
const pick = (list) => list[Math.floor(rand() * list.length)]

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function repeat(entries) {
  return entries.flatMap(([value, count]) => Array(count).fill(value))
}

export const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export const TEAM = ['K. Sharma', 'R. Mehta', 'S. Verma', 'A. Singh', 'P. Joshi']

export const CURRENT_USER = {
  name: 'Kritika Sharma',
  initials: 'KS',
  team: 'CRM Team',
}

export const STAGES = ['New Enquiry', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']

/* Bansal Geo's seven service lines, as listed on bansalgeo.com. */
export const SERVICES = [
  'Mineral Exploration & Resources',
  'Mineral Economics & Valuation',
  'Environment, Community & Permitting',
  'Mine Planning & Prefeasibility Study',
  'Hydrogeology & Groundwater',
  'Remote Sensing, GIS & Aerial Mapping',
  'Geotechnical Services',
]

export const SERVICE_DETAILS = {
  'Mineral Exploration & Resources': ['Exploration Programme Design', 'Geological Modelling', 'Resource Estimation', 'Drilling Supervision'],
  'Mineral Economics & Valuation': ['Mine Valuation Report', 'Financial Modelling', 'Technical Due Diligence'],
  'Environment, Community & Permitting': ['Environmental Clearance (EC)', 'EIA / EMP Report', 'CTE / CTO Compliance', 'Mine Closure Plan'],
  'Mine Planning & Prefeasibility Study': ['Mining Plan Preparation', 'Prefeasibility Study', 'Lease Renewal Support'],
  'Hydrogeology & Groundwater': ['Groundwater Investigation', 'Aquifer Modelling', 'Dewatering System Design'],
  'Remote Sensing, GIS & Aerial Mapping': ['DGPS Survey', 'Drone Survey & Mapping', 'Land Use Mapping'],
  'Geotechnical Services': ['Slope Stability Analysis', 'Rock Mechanics Study', 'Soil & Rock Testing'],
}

export const MINERALS = [
  'Limestone',
  'Marble',
  'Granite',
  'Sandstone',
  'Masonry Stone',
  'Iron Ore',
  'Bauxite',
  'Lignite',
  'Copper',
  'Other',
]

/* The bansalgeo.com enquiry form opens WhatsApp, so website and WhatsApp enquiries are one source. */
export const LEAD_SOURCES = ['Phone Call', 'Website / WhatsApp', 'Referral', 'Walk-in', 'Email']

export const FOLLOW_UP_TYPES = ['Call', 'Meeting', 'Site Visit', 'Presentation', 'Review']

export const PRIORITIES = ['High', 'Medium', 'Low']

export const CLIENT_TYPES = ['Company', 'Individual']

export const CONTACT_MODES = ['Call', 'WhatsApp', 'Email']

export const TIMELINES = ['Within 1 month', '1–3 months', '3–6 months', '6+ months']

export const PROJECT_TYPES = ['Major mineral lease', 'Minor mineral lease', 'Exploration block', 'Operating mine', 'Greenfield project']

export const LOST_REASONS = ['Price too high', 'Went with a competitor', 'No response from client', 'Project on hold', 'Not a fit for our services']

const REGIONS = [
  'Rajputana',
  'Aravali',
  'Mewar',
  'Marwar',
  'Shekhawati',
  'Hadoti',
  'Thar',
  'Vindhya',
  'Chambal',
  'Sirohi',
  'Nagaur',
  'Bhilwara',
  'Jhunjhunu',
  'Kutch',
  'Malwa',
  'Deccan',
  'Satpura',
  'Banas',
]
const SUFFIXES = [
  'Minerals',
  'Stone Works',
  'Cement Ltd.',
  'Granites',
  'Mining Co.',
  'Limestone',
  'Resources',
  'Marbles',
  'Infra & Mining',
  'Metals',
]
const FIRST_NAMES = ['Mahesh', 'Suresh', 'Anita', 'Rakesh', 'Pooja', 'Vikram', 'Neha', 'Arjun', 'Deepak', 'Kavita', 'Rohit', 'Sunita']
const LAST_NAMES = ['Jain', 'Agarwal', 'Rathore', 'Choudhary', 'Gupta', 'Shekhawat', 'Meena', 'Bhati', 'Saini', 'Mathur']

/*
 * Distribution targets — change these to reshape the demo.
 * One row per month (oldest first, last row = current month) with how many of that month's
 * enquiries sit in each stage today. Older months are further down the funnel.
 * Column order: New, Contacted, Qualified, Proposal Sent, Negotiation, Won, Lost.
 * Totals: 20 / 17 / 14 / 11 / 8 / 12 / 4 = 86 leads.
 */
const MONTHLY_PLAN = [
  [0, 2, 2, 2, 1, 2, 1],
  [0, 2, 2, 2, 2, 3, 1],
  [2, 3, 3, 3, 2, 1, 1],
  [2, 2, 3, 2, 1, 3, 1],
  [6, 4, 3, 1, 1, 2, 0],
  [10, 4, 1, 1, 1, 1, 0],
]
const SERVICE_COUNTS = [
  ['Environment, Community & Permitting', 18],
  ['Mine Planning & Prefeasibility Study', 17],
  ['Mineral Exploration & Resources', 16],
  ['Remote Sensing, GIS & Aerial Mapping', 11],
  ['Hydrogeology & Groundwater', 9],
  ['Mineral Economics & Valuation', 8],
  ['Geotechnical Services', 7],
]

/* Each month's enquiries as { date, stage }, with dates spread across that month (up to today). */
function buildMonthlyEnquiries() {
  return MONTHLY_PLAN.flatMap((stageCounts, index) => {
    const monthsAgo = MONTHLY_PLAN.length - 1 - index
    const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsAgo, 1)
    const monthEnd = monthsAgo === 0 ? TODAY : new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsAgo + 1, 0)
    const span = monthEnd.getDate()
    const stages = shuffle(repeat(STAGES.map((stage, i) => [stage, stageCounts[i]])))
    return stages.map((stage) => ({
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 + Math.floor(rand() * span)),
      stage,
    }))
  })
}

/* Days from today for the next follow-up: a few slipped (overdue), most in the next two weeks. */
function followUpOffset() {
  const roll = rand()
  if (roll < 0.06) return -1 - Math.floor(rand() * 3)
  if (roll < 0.14) return 0
  return 1 + Math.floor(rand() * 14)
}

function buildCompanyNames(count) {
  const names = new Set()
  while (names.size < count) names.add(`${pick(REGIONS)} ${pick(SUFFIXES)}`)
  return [...names]
}

/*
 * A lead looks like:
 * { id, company, contactPerson, service, serviceDetail, assignedTo, stage,
 *   createdOn: 'YYYY-MM-DD', nextFollowUp: 'YYYY-MM-DD' | null }
 * Enquiries added through the form also carry mineral and referredBy when given.
 * Leads that have been quoted also carry quoteValue (₹); lost leads carry lostReason.
 * All leads carry priority, clientType, preferredContact, expectedTimeline, estimatedValue and description;
 * leads from Qualified onwards also carry project { title, type, siteLocation, scope, technical, startDate, budget, instructions }.
 * Documents and tags added in the demo are stored as documents [] and tags [].
 * Quotation workflow: quoteStatus ('Sent' | 'Revised' | 'Accepted' | 'Rejected'), a saved quote {…} once built
 * in the app, approval { quoteAccepted, poReceived, advanceReceived, agreementSigned } and
 * onboarding { kyc, leaseDocs, kickoff, teamAssigned, portal }.
 */
function buildLeads() {
  const enquiries = buildMonthlyEnquiries().sort((a, b) => a.date.getTime() - b.date.getTime())
  const services = shuffle(repeat(SERVICE_COUNTS))
  const companies = buildCompanyNames(enquiries.length)

  return enquiries.map(({ date, stage }, index) => {
    const service = services[index]
    const isOpen = stage !== 'Won' && stage !== 'Lost'
    return {
      id: `BG-${date.getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      company: companies[index],
      contactPerson: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      service,
      serviceDetail: pick(SERVICE_DETAILS[service]),
      assignedTo: pick(TEAM),
      stage,
      createdOn: toISODate(date),
      nextFollowUp: isOpen ? toISODate(addDays(TODAY, followUpOffset())) : null,
    }
  })
}

const FOLLOW_UP_TEMPLATES = {
  'New Enquiry': [['Call', 'Intro call with', 'Understand scope and site location']],
  Contacted: [['Site Visit', 'Site visit for', 'Discuss site survey details']],
  Qualified: [['Meeting', 'Meeting with', 'Share technical capability document']],
  'Proposal Sent': [['Presentation', 'Client presentation for', 'Walk through the proposal']],
  Negotiation: [['Review', 'Review proposal with', 'Discuss commercial terms']],
  Won: [],
  Lost: [],
}

const TIMES = ['10:00', '11:00', '11:30', '12:30', '15:00', '16:00', '16:30']

function buildFollowUps(leads) {
  return leads
    .filter((lead) => lead.nextFollowUp)
    .map((lead, index) => {
      const [type, prefix, note] = FOLLOW_UP_TEMPLATES[lead.stage][0]
      return {
        id: `FU-${String(index + 1).padStart(3, '0')}`,
        leadId: lead.id,
        type,
        title: `${prefix} ${lead.company}`,
        note,
        date: lead.nextFollowUp,
        time: pick(TIMES),
      }
    })
}

/*
 * Quotation value (₹) for every lead that has received a quotation.
 * Uses its own random stream so adding amounts doesn't change any other generated data.
 */
const QUOTED_STAGES = ['Proposal Sent', 'Negotiation', 'Won', 'Lost']
const QUOTE_RANGES = {
  'Mineral Exploration & Resources': [250000, 900000],
  'Mineral Economics & Valuation': [150000, 500000],
  'Environment, Community & Permitting': [150000, 600000],
  'Mine Planning & Prefeasibility Study': [120000, 450000],
  'Hydrogeology & Groundwater': [100000, 350000],
  'Remote Sensing, GIS & Aerial Mapping': [40000, 180000],
  'Geotechnical Services': [80000, 300000],
}

function withQuotations(leads) {
  const quoteRand = seededRandom(7310)
  return leads.map((lead) => {
    if (!QUOTED_STAGES.includes(lead.stage)) return lead
    const [min, max] = QUOTE_RANGES[lead.service]
    const amount = Math.round((min + quoteRand() * (max - min)) / 5000) * 5000
    return { ...lead, quoteValue: amount }
  })
}

/*
 * Contact details, source and location for the generated leads (plus a reason on lost ones).
 * Also on its own random stream, so the rest of the demo data stays exactly the same.
 */
/* Mining districts; Rajasthan (home market, Jaipur office) is listed most often so it dominates. */
const DISTRICTS = [
  'Rajsamand, Rajasthan',
  'Udaipur, Rajasthan',
  'Jodhpur, Rajasthan',
  'Nagaur, Rajasthan',
  'Bhilwara, Rajasthan',
  'Chittorgarh, Rajasthan',
  'Jaisalmer, Rajasthan',
  'Sirohi, Rajasthan',
  'Kutch, Gujarat',
  'Banaskantha, Gujarat',
  'Katni, Madhya Pradesh',
  'Satna, Madhya Pradesh',
  'Korba, Chhattisgarh',
  'Raipur, Chhattisgarh',
  'Dhanbad, Jharkhand',
  'Keonjhar, Odisha',
  'Bellary, Karnataka',
]

function withContactDetails(leads) {
  const r = seededRandom(4411)
  const choose = (list) => list[Math.floor(r() * list.length)]
  return leads.map((lead) => {
    const [first, last] = lead.contactPerson.toLowerCase().split(' ')
    const domain = lead.company.toLowerCase().replace(/[^a-z]/g, '').slice(0, 18)
    return {
      ...lead,
      phone: `9${String(Math.floor(r() * 1e9)).padStart(9, '0')}`,
      email: `${first}.${last}@${domain}.in`,
      location: choose(DISTRICTS),
      source: choose(LEAD_SOURCES),
      ...(lead.stage === 'Lost' ? { lostReason: choose(LOST_REASONS) } : {}),
    }
  })
}

/*
 * Enquiry and project details for the generated leads. Leads that are Qualified or further along
 * already have project requirements filled in; earlier ones don't yet — just like real enquiries.
 * Own random stream again, so nothing generated above changes.
 */
const STAGE_ORDER = ['New Enquiry', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']

function withEnquiryDetails(leads) {
  const r = seededRandom(5521)
  const choose = (list) => list[Math.floor(r() * list.length)]
  return leads.map((lead) => {
    const priority = choose(['High', 'Medium', 'Medium', 'Low'])
    const [district] = lead.location.split(',')
    const area = (1 + r() * 9).toFixed(2)
    const hasProject = STAGE_ORDER.indexOf(lead.stage) >= 2
    const guess = 150000 + r() * 350000 // drawn for every lead so the stream stays in step
    const estimate = Math.round((lead.quoteValue ?? guess) / 10000) * 10000
    return {
      ...lead,
      priority,
      clientType: r() < 0.9 ? 'Company' : 'Individual',
      preferredContact: choose(CONTACT_MODES),
      expectedTimeline: choose(TIMELINES),
      estimatedValue: estimate,
      description: `Client needs ${lead.serviceDetail} for their ${area} ha site near ${district}.`,
      ...(hasProject
        ? {
            project: {
              title: `${lead.serviceDetail} — ${district}`,
              type: choose(PROJECT_TYPES),
              siteLocation: `${lead.location} · ${area} ha`,
              scope: `${lead.serviceDetail} covering the full lease area, with field visits and a final report.`,
              technical: choose(['DGPS survey data to be shared by client', 'Existing geological report available', 'Drone survey needed before report', 'Water table data required']),
              startDate: '',
              budget: estimate,
              instructions: '',
            },
          }
        : {}),
    }
  })
}

/*
 * Where each lead is in the post-quotation workflow (own random stream):
 * about half the Negotiation leads have accepted the quotation and are collecting approvals;
 * Won leads have finished approvals, and older ones have finished onboarding too.
 */
function withLifecycle(leads) {
  const r = seededRandom(8123)
  return leads.map((lead) => {
    const roll = r()
    const age = Math.round((TODAY - new Date(lead.createdOn)) / 86_400_000)
    if (lead.stage === 'Negotiation') {
      if (roll < 0.5) return { ...lead, quoteStatus: 'Revised' }
      return { ...lead, quoteStatus: 'Accepted', approval: { quoteAccepted: true, poReceived: r() < 0.6, advanceReceived: r() < 0.3, agreementSigned: false } }
    }
    if (lead.stage === 'Won') {
      const done = age > 60 ? 5 : Math.floor(roll * 5)
      const onboarding = Object.fromEntries(['kyc', 'leaseDocs', 'kickoff', 'teamAssigned', 'portal'].map((key, i) => [key, i < done]))
      return { ...lead, quoteStatus: 'Accepted', approval: { quoteAccepted: true, poReceived: true, advanceReceived: true, agreementSigned: true }, onboarding }
    }
    if (lead.stage === 'Lost' && lead.quoteValue) return { ...lead, quoteStatus: 'Rejected' }
    if (lead.stage === 'Proposal Sent') return { ...lead, quoteStatus: 'Sent' }
    return lead
  })
}

export const LEADS = withLifecycle(withEnquiryDetails(withContactDetails(withQuotations(buildLeads()))))
export const FOLLOW_UPS = buildFollowUps(LEADS)
