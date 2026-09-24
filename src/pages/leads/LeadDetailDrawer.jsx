import { ArrowRight, Mail, MapPin, Phone, X, XCircle } from 'lucide-react'
import { useEffect, useId } from 'react'
import { StagePill } from '../../components/common/StagePill'
import { ClientQueries } from '../../components/lead/ClientQueries'
import { LeadActivity } from '../../components/lead/LeadActivity'
import { LeadFollowUps } from '../../components/lead/LeadFollowUps'
import { LeadStageActions } from '../../components/lead/LeadStageActions'
import { PriorityPill } from '../../components/lead/PriorityPill'
import { useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { leadAgeLabel, servicesOf } from '../../utils/leads'
import { Portal } from '../../components/common/Portal'
import { RoleLink } from '../../components/common/RoleLink'

const todayISO = toISODate(TODAY)

/* Quick look at a lead from the list; "Open full details" goes to the Enquiry Details page. */
export function LeadDetailDrawer({ leadId, startWithFollowUpForm = false, onClose, onMarkLost }) {
  const money = useMoney()
  const { leads } = useCrm()
  const lead = leads.find((l) => l.id === leadId)
  const titleId = useId()

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !document.querySelector('.dialog-root') && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!lead) return null

  const facts = [
    ['Service', servicesOf(lead).map((x) => x.serviceDetail).join(' · '), servicesOf(lead).length > 1 ? `${servicesOf(lead).length} services` : lead.service],
    ['Quotation', lead.quoteValue ? money.short(lead.quoteValue) : 'Not sent yet'],
    ['Assigned to', lead.assignedTo],
    ['Source', lead.source ?? '—'],
    ['Received', formatDayMonth(lead.createdOn), leadAgeLabel(lead)],
    ['Next follow-up', lead.nextFollowUp ? (lead.nextFollowUp === todayISO ? 'Today' : formatDayMonth(lead.nextFollowUp)) : '—'],
  ]

  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer lead-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{lead.company}</h2>
              <span className="muted">
                {lead.id} · <StagePill stage={lead.stage} /> <PriorityPill priority={lead.priority} />
              </span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>

          <div className="drawer-body lead-drawer-body">
            <RoleLink to={`/leads/${lead.id}`} className="open-details" hideIfLocked>
              Open full details <ArrowRight size={15} />
            </RoleLink>

            <section className="contact-card">
              <strong>{lead.contactPerson}</strong>
              <div className="contact-lines">
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
              </div>
            </section>

            <dl className="fact-grid">
              {facts.map(([label, value, sub]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {value}
                    {sub && <span>{sub}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            {lead.stage === 'Lost' && lead.lostReason && (
              <p className="lost-note">
                <XCircle size={16} /> Lost: {lead.lostReason}
              </p>
            )}

            <section className="lead-section">
              <h3>Stage</h3>
              <LeadStageActions lead={lead} onMarkLost={onMarkLost} />
            </section>

            <section className="lead-section">
              <ClientQueries lead={lead} />
            </section>

            <section className="lead-section">
              <LeadFollowUps lead={lead} startWithForm={startWithFollowUpForm} />
            </section>

            <section className="lead-section">
              <LeadActivity lead={lead} />
            </section>
          </div>
        </aside>
      </div>
    </Portal>
  )
}
