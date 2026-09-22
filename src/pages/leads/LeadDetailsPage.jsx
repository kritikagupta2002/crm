import { ArrowLeft, CalendarPlus, ExternalLink, FilePlus2, FileText, Mail, MapPin, MessageCircle, Pencil, Phone, XCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { StagePill } from '../../components/common/StagePill'
import { queriesOf } from '../../data/queries'
import { ClientPayments } from '../../components/lead/ClientPayments'
import { ClientQueries } from '../../components/lead/ClientQueries'
import { LeadActivity } from '../../components/lead/LeadActivity'
import { LeadFollowUps } from '../../components/lead/LeadFollowUps'
import { LeadStageActions } from '../../components/lead/LeadStageActions'
import { SharePortalButton } from '../../components/lead/SharePortalButton'
import { PriorityPill } from '../../components/lead/PriorityPill'
import { useCrm, useMoney } from '../../context/crm'
import { useEnquiryForm } from '../../context/enquiryForm'
import { TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { leadAgeLabel } from '../../utils/leads'
import { whatsappLink } from '../../utils/whatsapp'
import { LeadDocuments } from './LeadDocuments'
import { LostReasonDialog } from './LostReasonDialog'
import { ProjectRequirements } from './ProjectRequirements'
import './leadDetails.css'
import { RoleLink } from '../../components/common/RoleLink'

const todayISO = toISODate(TODAY)

function DetailList({ rows }) {
  return (
    <dl className="detail-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || <span className="muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

function Overview({ lead }) {
  const money = useMoney()
  return (
    <div className="overview">
      <section>
        <h3>Client</h3>
        <DetailList
          rows={[
            [lead.clientType === 'Individual' ? 'Client' : 'Company', lead.company],
            ['Client type', lead.clientType],
            ['Contact person', lead.contactPerson],
            ['Mobile', lead.phone && `+91 ${lead.phone.slice(0, 5)} ${lead.phone.slice(5)}`],
            ['Email', lead.email],
            ['Location', lead.location],
            ['Preferred contact', lead.preferredContact],
            ['Referred by', lead.referredBy],
          ]}
        />
      </section>
      <section>
        <h3>Enquiry</h3>
        <DetailList
          rows={[
            ['Service', lead.service],
            ['Service required', lead.serviceDetail],
            ['Mineral', lead.mineral],
            ['Source', lead.source],
            ['Received', `${formatDayMonth(lead.createdOn)} · ${leadAgeLabel(lead).toLowerCase()}`],
            ['Expected timeline', lead.expectedTimeline],
            ['Estimated value', lead.estimatedValue ? money.short(lead.estimatedValue) : ''],
          ]}
        />
      </section>
      <section className="overview-wide">
        <h3>Description</h3>
        <p className="description">{lead.description || <span className="muted">No description added.</span>}</p>
      </section>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'project', label: 'Project Requirements' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Follow-ups & Activity' },
]

/* Everything about one enquiry. The tab lives in the URL (?tab=…) so a specific tab can be shared or reloaded. */
export function LeadDetailsPage() {
  const money = useMoney()
  const { leadId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { leads, followUps, changeStage } = useCrm()
  const { openEditForm } = useEnquiryForm()
  const [losing, setLosing] = useState(false)
  const [followUpRequests, setFollowUpRequests] = useState(0) // bumps each time "Schedule Follow-up" is clicked
  const cancelLost = useCallback(() => setLosing(false), [])

  const lead = leads.find((l) => l.id === leadId)
  const tab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'overview'
  const openTab = (id) => setSearchParams(id === 'overview' ? {} : { tab: id }, { replace: true })

  if (!lead) {
    return (
      <div className="card coming-soon">
        <h1>Enquiry not found</h1>
        <p className="muted">There's no enquiry with the ID {leadId}.</p>
        <Link to="/leads" className="btn btn-primary">
          Back to Leads &amp; Enquiries
        </Link>
      </div>
    )
  }

  const pendingCount = followUps.filter((f) => f.leadId === lead.id).length
  const isClosed = lead.stage === 'Won' || lead.stage === 'Lost'
  const counts = { documents: lead.documents?.length ?? 0, activity: pendingCount }

  return (
    <div className="lead-details">
      <Link to="/leads" className="back-link">
        <ArrowLeft size={15} /> Leads &amp; Enquiries
      </Link>

      <header className="page-header lead-header">
        <div className="page-title">
          <h1>{lead.company}</h1>
          <p className="lead-meta">
            <span className="mono-sub">{lead.id}</span>
            <StagePill stage={lead.stage} />
            <PriorityPill priority={lead.priority} />
            <span className="muted">Assigned to {lead.assignedTo}</span>
          </p>
        </div>
        <div className="page-actions">
          {lead.phone && (
            <>
              <a className="btn" href={`tel:+91${lead.phone}`}>
                <Phone size={15} /> Call
              </a>
              <a className="btn btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappLink(lead.phone, `Hello ${lead.contactPerson}, this is ${lead.assignedTo} from Bansal Geo regarding your enquiry for ${lead.serviceDetail}.`)}>
                <MessageCircle size={15} /> WhatsApp
              </a>
            </>
          )}
          {!isClosed && (
            <button
              className="btn"
              title="Schedule a follow-up"
              onClick={() => {
                setFollowUpRequests((n) => n + 1)
                openTab('activity')
              }}
            >
              <CalendarPlus size={15} /> Follow-up
            </button>
          )}
          {(lead.quote || lead.quoteValue) ? (
            <RoleLink className="btn" to={`/quotations?open=${lead.id}`} title="View quotation" hideIfLocked>
              <FileText size={15} /> Quotation
            </RoleLink>
          ) : (
            !isClosed &&
            !money.hidden && (
              <RoleLink className="btn" to={`/quotations?new=${lead.id}`} title="Create a quotation" hideIfLocked>
                <FilePlus2 size={15} /> Quotation
              </RoleLink>
            )
          )}
          <button className="btn btn-primary" onClick={() => openEditForm(lead)} title="Edit enquiry details">
            <Pencil size={15} /> Edit
          </button>
        </div>
      </header>

      <div className="details-layout">
        <section className="card details-main">
          <nav className="details-tabs" aria-label="Enquiry sections">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'is-active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => openTab(t.id)}>
                {t.label}
                {counts[t.id] > 0 && <span>{counts[t.id]}</span>}
              </button>
            ))}
          </nav>
          <div key={tab} className="details-panel tab-panel">
            {tab === 'overview' && <Overview lead={lead} />}
            {tab === 'project' && <ProjectRequirements key={lead.id} lead={lead} />}
            {tab === 'documents' && <LeadDocuments lead={lead} />}
            {tab === 'activity' && (
              <div className="activity-panel">
                {(lead.approval?.quoteAccepted || lead.stage === 'Won') && (
                  <section className="lead-section first">
                    <ClientPayments lead={lead} />
                  </section>
                )}
                {queriesOf(lead).length > 0 && (
                  <section className={`lead-section ${lead.approval?.quoteAccepted || lead.stage === 'Won' ? '' : 'first'}`}>
                    <ClientQueries lead={lead} />
                  </section>
                )}
                <section className={`lead-section ${queriesOf(lead).length || lead.approval?.quoteAccepted || lead.stage === 'Won' ? '' : 'first'}`}>
                  <LeadFollowUps key={followUpRequests} lead={lead} startWithForm={followUpRequests > 0} />
                </section>
                <section className="lead-section">
                  <LeadActivity lead={lead} />
                </section>
              </div>
            )}
          </div>
        </section>

        <aside className="details-side">
          <section className="card side-card">
            <h3>Stage</h3>
            <LeadStageActions lead={lead} onMarkLost={() => setLosing(true)} />
            {lead.stage === 'Lost' && lead.lostReason && (
              <p className="lost-note">
                <XCircle size={16} /> Lost: {lead.lostReason}
              </p>
            )}
          </section>

          <section className="card side-card">
            <dl className="side-facts">
              <div>
                <dt>Quotation</dt>
                <dd>{lead.quoteValue ? money.short(lead.quoteValue) : <span className="muted">Not sent yet</span>}</dd>
              </div>
              <div>
                <dt>Estimated value</dt>
                <dd>{lead.estimatedValue ? money.short(lead.estimatedValue) : <span className="muted">—</span>}</dd>
              </div>
              <div>
                <dt>Next follow-up</dt>
                <dd className={lead.nextFollowUp && lead.nextFollowUp < todayISO ? 'text-red' : undefined}>
                  {lead.nextFollowUp ? (lead.nextFollowUp === todayISO ? 'Today' : formatDayMonth(lead.nextFollowUp)) : <span className="muted">—</span>}
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatDayMonth(lead.createdOn)}</dd>
              </div>
            </dl>
          </section>

          <section className="card side-card contact-side">
            <h3>{lead.contactPerson}</h3>
            {lead.phone && (
              <a href={`tel:+91${lead.phone}`}>
                <Phone size={14} /> +91 {lead.phone.slice(0, 5)} {lead.phone.slice(5)}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}>
                <Mail size={14} /> {lead.email}
              </a>
            )}
            {lead.location && (
              <span>
                <MapPin size={14} /> {lead.location}
              </span>
            )}
            <div className="portal-preview-links">
              <Link to={`/portal?lead=${lead.id}`} className="portal-preview-link">
                <ExternalLink size={14} /> Client portal
              </Link>
              <SharePortalButton lead={lead} className="portal-preview-link" label="Send login" />
            </div>
          </section>
        </aside>
      </div>

      {losing && (
        <LostReasonDialog
          company={lead.company}
          onCancel={cancelLost}
          onConfirm={(reason) => {
            changeStage(lead.id, 'Lost', { lostReason: reason })
            setLosing(false)
          }}
        />
      )}
    </div>
  )
}
