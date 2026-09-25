import { NAS_ROOT, SEEDED_DOC_RECORDS } from '../data/documents'
import { VENDORS } from '../data/vendors'
import { sharedBeforeISO } from './projects'

/*
 * Document Management: every government letter on the projects is a document on its way through the flowchart —
 * scanned to the NAS, filed and linked, verified by a second person, given its access, shared with the client,
 * its original dispatched — with a timeline of who did each step. A document's record holds those steps
 * (data/documents.js for the demo's, the store's docs for changes made in the app).
 */
export const DOC_STAGES = ['To verify', 'To authorize', 'To share', 'To dispatch', 'Done']
export const STAGE_TONE = { 'To verify': 'tone-attention', 'To authorize': 'tone-info', 'To share': 'tone-info', 'To dispatch': 'tone-attention', Done: 'tone-good' }
export const DISPATCH_TONE = { 'To dispatch': 'tone-attention', Dispatched: 'tone-info', Received: 'tone-good' }

const at = (day, time) => new Date(`${day}T${time}:00`).toISOString()
const minutesAfter = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()

/* What kind of letter it is, from its title when the record doesn't say. */
export function docKind(letter) {
  if (letter.kind) return letter.kind
  const t = letter.title.toLowerCase()
  if (t.includes('acknowledg')) return 'Acknowledgement'
  if (t.includes('notice')) return 'Notice'
  if (/query|deficien/.test(t)) return 'Query'
  if (t.includes('lease')) return 'Lease document'
  if (/permission|noc|consent/.test(t)) return 'Permission / NOC'
  if (/approv|accept|grant|sanction/.test(t)) return 'Approval'
  if (t.includes('circular')) return 'Circular'
  return 'Letter'
}

/* Originals worth sending to the client: what grants something, and lease papers. */
export const originalNeeded = (kind) => ['Approval', 'Permission / NOC', 'Lease document'].includes(kind)

const safe = (text) => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* Where the scan sits on the QNAP NAS: client, project, then the letter by date and reference. */
export const nasPath = (letter, project) => `${NAS_ROOT}\\${safe(project.lead.company)}\\${project.id}\\Govt-Letters\\${letter.date}_${safe(letter.ref)}.pdf`

/*
 * A letter the demo has no record for: the last ten days' unshared letters wait for verification; older ones were
 * filed by the project's coordinator, verified by the Admin and shared with the client the day they came.
 */
function defaultRecord(letter, project) {
  const filedBy = project.team?.coordinator || 'A. Singh'
  const filedAt = at(letter.date, '11:00')
  if (!letter.sharedOn && letter.date >= sharedBeforeISO) return { filedBy, filedAt }
  return {
    filedBy,
    filedAt,
    verify: { status: 'Verified', by: 'Kritika Gupta', at: at(letter.date, '14:30') },
    access: { client: true, vendor: false, by: 'Kritika Gupta', at: at(letter.date, '14:40') },
    dispatch: { status: 'Not needed' },
  }
}

export const vendorName = (vendorId, vendors = VENDORS) => vendors.find((v) => v.id === vendorId)?.name ?? vendorId

/* Who can open it, in words: Office · Client · Rajasthan Drilling Co. */
export function accessLabel(access, links = {}, vendors) {
  if (!access) return 'Not set'
  return ['Office', access.client && 'Client', access.vendor && links.vendorId && vendorName(links.vendorId, vendors)].filter(Boolean).join(' · ')
}

/* The timeline of a record that has none saved yet, from its steps. */
function eventsOf(record, letter, project, vendors) {
  const links = record.links ?? {}
  const linked = [project.lead.company, links.leaseNo && `lease ${links.leaseNo}`, links.vendorId && vendorName(links.vendorId, vendors)].filter(Boolean).join(', ')
  const events = [
    { at: minutesAfter(record.filedAt, -25), by: 'Front office scanner', text: `Scanned${letter.pages ? `, ${letter.pages} page${letter.pages === 1 ? '' : 's'}` : ''} — saved to the NAS` },
    { at: record.filedAt, by: record.filedBy, text: `Filed to ${project.id} · linked to ${linked}` },
  ]
  const { verify, access, dispatch } = record
  if (verify) events.push({ at: verify.at, by: verify.by, text: verify.status === 'Verified' ? 'Verified against the original' : `Sent back for a rescan: ${verify.reason}${verify.note ? ` — ${verify.note}` : ''}` })
  if (access) events.push({ at: access.at, by: access.by, text: `Access set: ${accessLabel(access, links, vendors)}` })
  if (access?.client && letter.sharedOn) {
    const sharedAt = at(letter.sharedOn, '16:30')
    events.push({ at: sharedAt > access.at ? sharedAt : minutesAfter(access.at, 5), by: access.by, text: 'Shared with the client — portal and WhatsApp' })
  }
  if (dispatch?.on) events.push({ at: at(dispatch.on, '12:00'), by: dispatch.by, text: `Original sent by ${dispatch.mode}${dispatch.docket ? ` · ${dispatch.docket}` : ''}` })
  if (dispatch?.receivedOn) events.push({ at: at(dispatch.receivedOn, '17:00'), by: dispatch.receivedBy || project.lead.contactPerson, text: 'Original received by the client' })
  return events.sort((a, b) => a.at.localeCompare(b.at))
}

/* Which step a document waits at. */
export function docStage(record, letter) {
  if (record.verify?.status !== 'Verified') return 'To verify'
  if (!record.access) return 'To authorize'
  if (record.access.client && !letter.sharedOn) return 'To share'
  if (record.dispatch?.status === 'To dispatch') return 'To dispatch'
  return 'Done'
}

/*
 * Every government letter across the projects as a document, newest first. projects: allProjects() (each with its
 * lead); saved: the store's records by document id; vendors: the vendor register.
 */
export function govtDocuments(projects, saved = {}, vendors = VENDORS) {
  return projects
    .flatMap((project) =>
      project.letters.map((letter) => {
        const base = saved[letter.id] ?? SEEDED_DOC_RECORDS[letter.id] ?? defaultRecord(letter, project)
        const record = { links: {}, ...base, events: base.events ?? eventsOf({ links: {}, ...base }, letter, project, vendors) }
        const kind = docKind(letter)
        return {
          id: letter.id,
          letter,
          project,
          lead: project.lead,
          record,
          kind,
          stage: docStage(record, letter),
          rescan: record.verify?.status === 'Rescan',
          nas: nasPath(letter, project),
          vendor: record.links.vendorId ? (vendors.find((v) => v.id === record.links.vendorId) ?? { id: record.links.vendorId, name: record.links.vendorId }) : null,
        }
      }),
    )
    .sort((a, b) => b.letter.date.localeCompare(a.letter.date) || b.record.filedAt.localeCompare(a.record.filedAt))
}

export const clientCanSee = (doc) => doc.record.verify?.status === 'Verified' && Boolean(doc.record.access?.client)
export const vendorCanSee = (doc, vendorId) => doc.record.verify?.status === 'Verified' && Boolean(doc.record.access?.vendor) && doc.record.links.vendorId === vendorId

/* Verification is a second pair of eyes: never the person who filed the scan. */
export const verifyBlock = (doc, userName) => (doc.record.filedBy === userName ? 'You filed this scan — someone else verifies it' : null)
