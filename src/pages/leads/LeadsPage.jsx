import { Download, KanbanSquare, List, Plus, Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { STAGE_COLORS } from '../../components/common/stageColors'
import { useCrm, useMoney } from '../../context/crm'
import { useEnquiryForm } from '../../context/enquiryForm'
import { LEAD_SOURCES, SERVICES, STAGES, TEAM } from '../../data/mockData'
import { downloadCsv } from '../../utils/exportCsv'
import { countBy, EMPTY_FILTERS, filterLeads, leadAgeDays, stateOf } from '../../utils/leads'
import { LeadDetailDrawer } from './LeadDetailDrawer'
import { LeadsBoard } from './LeadsBoard'
import { LeadsInsights } from './LeadsInsights'
import { LeadsTable } from './LeadsTable'
import { LostReasonDialog } from './LostReasonDialog'
import './leads.css'

const VIEW_KEY = 'bansal-crm:leads-view'

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

const EXPORT_COLUMNS = [
  { label: 'Enquiry ID', value: (l) => l.id },
  { label: 'Company', value: (l) => l.company },
  { label: 'Contact person', value: (l) => l.contactPerson },
  { label: 'Phone', value: (l) => l.phone },
  { label: 'Email', value: (l) => l.email },
  { label: 'Location', value: (l) => l.location },
  { label: 'Service', value: (l) => l.service },
  { label: 'Service required', value: (l) => l.serviceDetail },
  { label: 'Quotation (INR)', value: (l) => l.quoteValue },
  { label: 'Assigned to', value: (l) => l.assignedTo },
  { label: 'Stage', value: (l) => l.stage },
  { label: 'Lost reason', value: (l) => l.lostReason },
  { label: 'Source', value: (l) => l.source },
  { label: 'Received on', value: (l) => l.createdOn },
  { label: 'Next follow-up', value: (l) => l.nextFollowUp },
  { label: 'Age (days)', value: (l) => leadAgeDays(l) },
]

export function LeadsPage() {
  const money = useMoney()
  const { leads, changeStage } = useCrm()
  const { openEnquiryForm } = useEnquiryForm()
  const [view, setView] = useState(readView)
  const [stageTab, setStageTab] = useState('All')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [openLead, setOpenLead] = useState(null) // { id, withFollowUpForm }
  const [losingLeadId, setLosingLeadId] = useState(null)
  const [pageSize, setPageSize] = useState(10)

  const filtered = filterLeads(leads, filters)
  const visible = view === 'list' && stageTab !== 'All' ? filtered.filter((lead) => lead.stage === stageTab) : filtered
  const openPipeline = filtered.filter((l) => l.stage === 'Proposal Sent' || l.stage === 'Negotiation').reduce((sum, l) => sum + (l.quoteValue ?? 0), 0)
  const hasFilters = Object.keys(EMPTY_FILTERS).some((key) => filters[key] !== EMPTY_FILTERS[key])
  const losingLead = leads.find((l) => l.id === losingLeadId)
  const states = countBy(leads, stateOf).map((row) => row.label).filter((label) => label !== 'Not specified')

  const switchView = (next) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Remembering the view is only a convenience.
    }
  }

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value })

  // Moving a card to "Lost" asks for a reason first.
  const moveLead = (id, stage) => (stage === 'Lost' ? setLosingLeadId(id) : changeStage(id, stage))
  const openDetails = (id) => setOpenLead({ id, withFollowUpForm: false })
  const closeDrawer = useCallback(() => setOpenLead(null), [])
  const cancelLost = useCallback(() => setLosingLeadId(null), [])

  return (
    <div className="leads-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Leads &amp; Enquiries</h1>
          <p>
            {filtered.length} leads · <b className="text-ink">{money.short(openPipeline)}</b> in open quotations
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, EXPORT_COLUMNS, visible)}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={openEnquiryForm}>
            <Plus size={17} /> Add New Enquiry
          </button>
        </div>
      </header>

      <section className="card leads-filters">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={filters.search} onChange={setFilter('search')} placeholder="Search company, contact, phone or ID" aria-label="Search leads" />
          </label>
          <select value={filters.service} onChange={setFilter('service')} aria-label="Service">
            <option value="">All services</option>
            {SERVICES.map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
          <select value={filters.owner} onChange={setFilter('owner')} aria-label="Assigned to">
            <option value="">Everyone</option>
            {TEAM.map((member) => (
              <option key={member}>{member}</option>
            ))}
          </select>
          <select value={filters.source} onChange={setFilter('source')} aria-label="Source">
            <option value="">All sources</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
          <select value={filters.state} onChange={setFilter('state')} aria-label="Location">
            <option value="">All locations</option>
            {states.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
          <select value={filters.period} onChange={setFilter('period')} aria-label="Received">
            <option value="all">Any time</option>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="year">This financial year</option>
          </select>
          {hasFilters && (
            <button className="link-button" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </button>
          )}

          <div className="segmented view-switch" role="group" aria-label="View">
            <button aria-pressed={view === 'list'} className={view === 'list' ? 'is-selected' : ''} onClick={() => switchView('list')}>
              <List size={15} /> List
            </button>
            <button aria-pressed={view === 'board'} className={view === 'board' ? 'is-selected' : ''} onClick={() => switchView('board')}>
              <KanbanSquare size={15} /> Board
            </button>
          </div>
        </div>

        {view === 'list' && (
          <nav className="stage-tabs" aria-label="Filter by stage">
            {['All', ...STAGES].map((stage) => {
              const count = stage === 'All' ? filtered.length : filtered.filter((l) => l.stage === stage).length
              return (
                <button
                  key={stage}
                  className={`stage-tab ${stageTab === stage ? 'is-active' : ''}`}
                  style={stage === 'All' ? undefined : { '--stage': STAGE_COLORS[stage].dot }}
                  onClick={() => setStageTab(stage)}
                  aria-pressed={stageTab === stage}
                >
                  {stage !== 'All' && <i />}
                  {stage}
                  <span>{count}</span>
                </button>
              )
            })}
          </nav>
        )}

        {view === 'board' && <LeadsBoard leads={filtered} onOpen={openDetails} onMove={moveLead} />}
      </section>

      {view === 'list' && (
        <div className="leads-layout">
          <section className="card leads-card">
            <LeadsTable
              key={JSON.stringify(filters) + stageTab}
              leads={visible}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onOpen={openDetails}
              onScheduleFollowUp={(id) => setOpenLead({ id, withFollowUpForm: true })}
              onMarkWon={(id) => changeStage(id, 'Won')}
              onMarkLost={setLosingLeadId}
            />
          </section>
          <LeadsInsights leads={visible} />
        </div>
      )}

      {openLead && (
        <LeadDetailDrawer
          key={openLead.id}
          leadId={openLead.id}
          startWithFollowUpForm={openLead.withFollowUpForm}
          onClose={closeDrawer}
          onMarkLost={setLosingLeadId}
        />
      )}
      {losingLead && (
        <LostReasonDialog
          company={losingLead.company}
          onCancel={cancelLost}
          onConfirm={(reason) => {
            changeStage(losingLead.id, 'Lost', { lostReason: reason })
            setLosingLeadId(null)
          }}
        />
      )}
    </div>
  )
}
