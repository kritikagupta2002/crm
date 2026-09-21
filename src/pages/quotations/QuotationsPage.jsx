import { CheckCircle2, Download, FilePlus2, FileText, Hourglass, Percent, Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { usePaged } from '../../components/common/Pager'
import { useCrm, useMoney } from '../../context/crm'
import { formatDayMonth } from '../../utils/date'
import { downloadCsv } from '../../utils/exportCsv'
import { QUOTE_STATUS_TONE, openQuotes, quoteFor } from '../../utils/workflow'
import { LostReasonDialog } from '../leads/LostReasonDialog'
import { QuotationBuilder } from './QuotationBuilder'
import { QuotationView } from './QuotationView'

const TABS = ['All', 'Sent', 'Revised', 'Changes requested', 'Accepted', 'Rejected', 'Expired']

const QUOTE_COLUMNS = [
  { label: 'Quotation', value: (r) => r.quote.number },
  { label: 'Enquiry', value: (r) => r.lead.id },
  { label: 'Client', value: (r) => r.lead.company },
  { label: 'Service', value: (r) => r.lead.serviceDetail },
  { label: 'Net (INR)', value: (r) => r.quote.net },
  { label: 'GST (INR)', value: (r) => r.quote.gst },
  { label: 'Total (INR)', value: (r) => r.quote.total },
  { label: 'Sent on', value: (r) => r.quote.sentOn },
  { label: 'Valid until', value: (r) => r.quote.validUntil },
  { label: 'Status', value: (r) => r.quote.displayStatus },
]

/* ?new=<leadId> opens the builder for that enquiry, ?open=<leadId> opens its quotation — used by other pages. */
export function QuotationsPage() {
  const money = useMoney()
  const { leads, changeStage } = useCrm()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState(null)

  const quotes = leads
    .map((lead) => ({ lead, quote: quoteFor(lead) }))
    .filter((row) => row.quote)
    .sort((a, b) => b.quote.sentOn.localeCompare(a.quote.sentOn))

  const q = search.trim().toLowerCase()
  const visible = quotes
    .filter((r) => tab === 'All' || r.quote.displayStatus === tab)
    .filter((r) => !q || `${r.quote.number} ${r.lead.company} ${r.lead.serviceDetail}`.toLowerCase().includes(q))

  const { rows: pageRows, pager } = usePaged(visible, 10, `${tab}|${q}`)
  const sum = (rows) => rows.reduce((s, r) => s + r.quote.total, 0)
  const open = openQuotes(leads)
  const accepted = quotes.filter((r) => r.quote.status === 'Accepted')
  const decided = accepted.length + quotes.filter((r) => r.quote.status === 'Rejected').length

  // Quotations can only be built for open enquiries; a link to a won/lost one shows its quotation instead.
  const requested = params.get('new') !== null ? params.get('new') || undefined : params.get('revise') || null
  const requestedLead = requested ? leads.find((l) => l.id === requested) : null
  const isClosedLead = requestedLead && (requestedLead.stage === 'Won' || requestedLead.stage === 'Lost')
  const building = requested === null || isClosedLead ? null : { leadId: requested }
  const viewing = params.get('open') ?? (isClosedLead ? requestedLead.id : null)
  const go = useCallback((next) => setParams(next, { replace: true }), [setParams])
  const close = useCallback(() => go({}), [go])
  const cancelReject = useCallback(() => setRejecting(null), [])

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Quotations &amp; Proposals</h1>
          <p>{quotes.length} quotations · {money.short(sum(open))} awaiting client decision</p>
        </div>
        {!money.hidden && (
          <div className="page-actions">
            <button className="btn" onClick={() => downloadCsv('quotations.csv', QUOTE_COLUMNS, visible)}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={() => go({ new: '' })}>
              <FilePlus2 size={16} /> New Quotation
            </button>
          </div>
        )}
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FileText} label="Awaiting Client Reply" value={open.length}>
          <span className="muted">{money.short(sum(open))} incl. GST</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} label="Accepted" value={accepted.length}>
          <span className="muted">{money.short(sum(accepted))} incl. GST</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Percent} label="Acceptance Rate" value={decided ? Math.round((accepted.length / decided) * 100) : 0} format={(n) => `${Math.round(n)}%`}>
          <span className="muted">of quotations decided</span>
        </KpiCard>
        <KpiCard tone="tone-urgent" icon={Hourglass} label="Expired" value={quotes.filter((r) => r.quote.displayStatus === 'Expired').length}>
          <span className="muted">Past validity, no answer yet</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotation no., client or service" aria-label="Search quotations" />
          </label>
        </div>
        <nav className="stage-tabs" aria-label="Filter by status">
          {TABS.map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{t === 'All' ? quotes.length : quotes.filter((r) => r.quote.displayStatus === t).length}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">No quotations here.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th className="num">Amount (incl. GST)</th>
                  <th>Sent</th>
                  <th>Valid till</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ lead, quote }) => (
                  <tr key={lead.id} className="clickable-row" onClick={() => go({ open: lead.id })}>
                    <td>
                      <button className="row-link">{quote.number}</button>
                      <div className="cell-sub">v{quote.version}</div>
                    </td>
                    <td>
                      <div className="cell-strong">{lead.company}</div>
                      <div className="cell-sub">{lead.id}</div>
                    </td>
                    <td>
                      <div className="cell-clip">{lead.serviceDetail}</div>
                    </td>
                    <td className="num nowrap">
                      <b className="text-ink">{money.full(quote.total)}</b>
                    </td>
                    <td className="nowrap">{formatDayMonth(quote.sentOn)}</td>
                    <td className={`nowrap ${quote.displayStatus === 'Expired' ? 'text-red' : ''}`}>
                      {formatDayMonth(quote.validUntil)}
                    </td>
                    <td>
                      <span className={`pill quote-status ${QUOTE_STATUS_TONE[quote.displayStatus]}`}>{quote.displayStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </section>

      {building && !money.hidden && <QuotationBuilder key={building.leadId ?? 'new'} leadId={building.leadId} onClose={close} onSaved={(id) => go({ open: id })} />}
      {viewing && !building && <QuotationView leadId={viewing} onClose={close} onRevise={(id) => go({ revise: id })} onReject={setRejecting} />}
      {rejecting && (
        <LostReasonDialog
          company={leads.find((l) => l.id === rejecting)?.company}
          onCancel={cancelReject}
          onConfirm={(reason) => {
            changeStage(rejecting, 'Lost', { lostReason: reason })
            setRejecting(null)
          }}
        />
      )}
    </div>
  )
}
