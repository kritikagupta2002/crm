import { Check, CheckCircle2, Download, FileScan, HardDrive, Link2, MessageCircle, PackageCheck, RotateCcw, Send, ShieldCheck, Truck, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SideDrawer } from '../../components/common/SideDrawer'
import { useAccess, useCrm } from '../../context/crm'
import { DISPATCH_MODES, RESCAN_REASONS } from '../../data/documents'
import { TODAY } from '../../data/mockData'
import { automationOf } from '../../utils/automations'
import { formatDate, formatNearDate, toISODate } from '../../utils/date'
import { DISPATCH_TONE, STAGE_TONE, accessLabel, originalNeeded, verifyBlock } from '../../utils/documents'
import { downloadLetter } from '../../utils/files'
import { whatsappLink } from '../../utils/whatsapp'

const STEPS = [
  ['Filed', () => true],
  ['Verified', (d) => d.record.verify?.status === 'Verified'],
  ['Access set', (d) => Boolean(d.record.access)],
  ['Shared', (d) => d.record.access && (!d.record.access.client || Boolean(d.letter.sharedOn))],
  ['Original', (d) => d.record.access && ['Not needed', 'Dispatched', 'Received'].includes(d.record.dispatch?.status ?? 'Not needed')],
]
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/* Where it stands, as five ticks: filed → verified → access → shared → original. */
function StepTrack({ doc }) {
  const done = STEPS.map(([, test]) => test(doc))
  const now = done.indexOf(false)
  return (
    <ol className="doc-track">
      {STEPS.map(([label], i) => (
        <li key={label} className={done[i] ? 'is-done' : i === now ? 'is-now' : ''}>
          <span className="doc-track-dot">{done[i] && <Check size={11} strokeWidth={3} />}</span>
          {label}
        </li>
      ))}
    </ol>
  )
}

/* Second pair of eyes: verified, or back for a rescan with what is wrong. */
function VerifyStep({ doc, blocked }) {
  const { verifyDocument } = useCrm()
  const [rescan, setRescan] = useState(false)
  const [reason, setReason] = useState(RESCAN_REASONS[0])
  const [note, setNote] = useState('')
  if (blocked) return <p className="doc-step-note">{blocked}. The Admin or another coordinator checks it against the original.</p>
  if (!rescan)
    return (
      <>
        <p className="doc-step-lead">Check the scan against the paper original: every page there, readable, the right letter.</p>
        <div className="app-actions">
          <button className="btn btn-success" onClick={() => verifyDocument(doc, { ok: true })}>
            <ShieldCheck size={15} /> Verified
          </button>
          <button className="btn" onClick={() => setRescan(true)}>
            <RotateCcw size={15} /> Send for rescan
          </button>
        </div>
      </>
    )
  return (
    <form
      className="app-decision"
      onSubmit={(e) => {
        e.preventDefault()
        verifyDocument(doc, { ok: false, reason, note: note.trim() })
      }}
    >
      <label className="field">
        <span className="field-label">What is wrong</span>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {RESCAN_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Note for whoever rescans it</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Page 3 is cut off at the bottom" />
      </label>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={() => setRescan(false)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Send for rescan
        </button>
      </div>
    </form>
  )
}

/* After a rescan request: the new copy, uploaded or taken from the scan inbox. */
function RescanStep({ doc }) {
  const { replaceDocScan, scanInbox } = useCrm()
  const input = useRef(null)
  const [scanId, setScanId] = useState('')
  const { verify } = doc.record
  return (
    <>
      <p className="doc-rescan">
        <RotateCcw size={15} />
        <span>
          <b>{verify.reason}</b>
          {verify.note && ` — ${verify.note}`}
          <span className="muted small">
            {' '}
            · {verify.by}, {formatNearDate(verify.at.slice(0, 10))}
          </span>
        </span>
      </p>
      <div className="doc-rescan-actions">
        <button className="btn btn-primary" onClick={() => input.current.click()}>
          <Upload size={15} /> Upload the new scan
        </button>
        <input
          ref={input}
          type="file"
          accept=".pdf,image/*"
          hidden
          onChange={(e) => {
            if (e.target.files[0]) replaceDocScan(doc, { file: e.target.files[0] })
            e.target.value = ''
          }}
        />
        {scanInbox.length > 0 && (
          <>
            <span className="muted small">or from the scan inbox</span>
            <select value={scanId} onChange={(e) => setScanId(e.target.value)} aria-label="Scan from the inbox">
              <option value="">Choose a scan…</option>
              {scanInbox.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button className="btn" disabled={!scanId} onClick={() => replaceDocScan(doc, { scan: scanInbox.find((s) => s.id === scanId) })}>
              Use this scan
            </button>
          </>
        )}
      </div>
    </>
  )
}

/* Who may open it: always the office; the client and the linked vendor if allowed; and whether the original goes out. */
function AuthorizeStep({ doc }) {
  const { authorizeDocument, settings } = useCrm()
  const [client, setClient] = useState(doc.kind !== 'Circular')
  const [vendor, setVendor] = useState(false)
  const [original, setOriginal] = useState(originalNeeded(doc.kind))
  return (
    <form
      className="doc-access"
      onSubmit={(e) => {
        e.preventDefault()
        authorizeDocument(doc, { client, vendor: vendor && Boolean(doc.vendor), original: client && original })
      }}
    >
      <label className="doc-check is-fixed">
        <input type="checkbox" checked disabled /> <span>Office team</span>
      </label>
      <label className="doc-check">
        <input type="checkbox" checked={client} onChange={(e) => setClient(e.target.checked)} />
        <span>
          Client — {doc.lead.company}
          <small>Shows in their portal{automationOf(settings, 'letter').whatsapp || automationOf(settings, 'letter').email ? '; they are told automatically' : ''}</small>
        </span>
      </label>
      <label className={`doc-check ${doc.vendor ? '' : 'is-off'}`}>
        <input type="checkbox" checked={vendor} disabled={!doc.vendor} onChange={(e) => setVendor(e.target.checked)} />
        <span>
          Vendor{doc.vendor ? ` — ${doc.vendor.name}` : ''}
          <small>{doc.vendor ? 'Shows in their vendor portal, under My Documents' : 'Link a vendor under “Linked to” to share it with one'}</small>
        </span>
      </label>
      <label className={`doc-check ${client ? '' : 'is-off'}`}>
        <input type="checkbox" checked={client && original} disabled={!client} onChange={(e) => setOriginal(e.target.checked)} />
        <span>
          Send the paper original to the client
          <small>It goes on the dispatch register</small>
        </span>
      </label>
      <div className="letter-form-actions">
        <button type="submit" className="btn btn-primary">
          <ShieldCheck size={15} /> Save access
        </button>
      </div>
    </form>
  )
}

function ShareStep({ doc }) {
  const { shareDocument, settings } = useCrm()
  const { letter, project, lead } = doc
  const message = `Dear ${lead.contactPerson}, we have received the ${letter.title} (${letter.ref}) from ${letter.authority} for ${project.name}. You can download it from your client portal: ${window.location.origin}/login — ${settings.companyName}`
  return (
    <>
      <p className="doc-step-lead">It is in {lead.company}’s portal. Tell {lead.contactPerson} it has come.</p>
      <div className="app-actions">
        {lead.phone && (
          <a className="btn btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappLink(lead.phone, message)} onClick={() => shareDocument(doc)}>
            <MessageCircle size={15} /> Tell client on WhatsApp
          </a>
        )}
        <button className="btn" onClick={() => shareDocument(doc, 'marked')}>
          Mark as shared
        </button>
      </div>
    </>
  )
}

/* The original on its way: how it went, the docket, the day. */
function DispatchStep({ doc }) {
  const { dispatchDocument } = useCrm()
  const [mode, setMode] = useState(DISPATCH_MODES[0])
  const [docket, setDocket] = useState('')
  const [on, setOn] = useState(toISODate(TODAY))
  const byHand = mode === 'By hand'
  return (
    <form
      className="app-decision doc-dispatch-form"
      onSubmit={(e) => {
        e.preventDefault()
        dispatchDocument(doc, { mode, docket: docket.trim(), on })
      }}
    >
      <p className="doc-step-lead">
        To {doc.lead.contactPerson}, {doc.lead.company}, {doc.lead.location}
      </p>
      <div className="doc-form-row">
        <label className="field">
          <span className="field-label">Sent by</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {DISPATCH_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{byHand ? 'Carried by' : 'Docket / tracking no.'}</span>
          <input value={docket} onChange={(e) => setDocket(e.target.value)} placeholder={byHand ? 'e.g. Office runner' : 'e.g. EE123456789IN'} required={!byHand} />
        </label>
        <label className="field">
          <span className="field-label">On</span>
          <input type="date" value={on} max={toISODate(TODAY)} onChange={(e) => setOn(e.target.value)} required />
        </label>
      </div>
      <div className="letter-form-actions">
        <button type="submit" className="btn btn-primary">
          <Truck size={15} /> Record dispatch
        </button>
      </div>
    </form>
  )
}

function ReceiveStep({ doc }) {
  const { receiveDocument } = useCrm()
  const [receivedBy, setReceivedBy] = useState(doc.lead.contactPerson)
  const [on, setOn] = useState(toISODate(TODAY))
  return (
    <form
      className="app-decision doc-dispatch-form"
      onSubmit={(e) => {
        e.preventDefault()
        receiveDocument(doc, { receivedBy: receivedBy.trim(), on })
      }}
    >
      <div className="doc-form-row">
        <label className="field">
          <span className="field-label">Received by</span>
          <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">On</span>
          <input type="date" value={on} min={doc.record.dispatch.on} max={toISODate(TODAY)} onChange={(e) => setOn(e.target.value)} required />
        </label>
      </div>
      <div className="letter-form-actions">
        <button type="submit" className="btn btn-primary">
          <PackageCheck size={15} /> Mark received
        </button>
      </div>
    </form>
  )
}

/* The lease number and the vendor on the work, changed in place. */
function LinksForm({ doc, onDone }) {
  const { linkDocument, vendors } = useCrm()
  const [leaseNo, setLeaseNo] = useState(doc.record.links.leaseNo ?? '')
  const [vendorId, setVendorId] = useState(doc.record.links.vendorId ?? '')
  return (
    <form
      className="doc-links-form"
      onSubmit={(e) => {
        e.preventDefault()
        linkDocument(doc, { leaseNo: leaseNo.trim(), vendorId })
        onDone()
      }}
    >
      <label className="field">
        <span className="field-label">Lease no.</span>
        <input value={leaseNo} onChange={(e) => setLeaseNo(e.target.value)} placeholder="e.g. ML 17/2004" autoFocus />
      </label>
      <label className="field">
        <span className="field-label">Vendor</span>
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">None</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.id})
            </option>
          ))}
        </select>
      </label>
      <div className="letter-form-actions">
        <button type="button" className="btn btn-small" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-small">
          Save links
        </button>
      </div>
    </form>
  )
}

const STEP_TITLE = { 'To verify': 'Verify the scan', 'To authorize': 'Set who can see it', 'To share': 'Share with the client', 'To dispatch': 'Dispatch the original' }

/* One government document: the scan, what it is linked to, the step it waits at, its access, the original and its trail. */
export function DocumentDrawer({ doc, onClose }) {
  const { settings, vendors, user } = useCrm()
  const { may } = useAccess()
  const [editingLinks, setEditingLinks] = useState(false)
  const { letter, project, lead, record } = doc
  const canAct = may('documents')
  const dispatch = record.dispatch
  const inTransit = dispatch?.status === 'Dispatched'
  const title = doc.rescan ? 'Rescan needed' : inTransit ? 'Original on its way' : STEP_TITLE[doc.stage]
  const links = [
    ['Client', <Link key="c" to={`/clients?open=${lead.id}`} className="cell-link">{lead.company}</Link>],
    ['Project', <Link key="p" to={`/projects/${project.id}?tab=documents`} className="cell-link">{project.id} · {project.name}</Link>],
    ['Lease no.', record.links.leaseNo || '—'],
    ['Vendor', doc.vendor ? `${doc.vendor.name} (${doc.vendor.id})` : '—'],
  ]

  return (
    <SideDrawer title={letter.title} sub={`${letter.ref} · ${letter.authority}`} onClose={onClose} className="doc-drawer">
      <div className="wo-head">
        <span className={`pill status-pill ${doc.rescan ? 'tone-urgent' : STAGE_TONE[doc.stage]}`}>{doc.rescan ? 'Rescan needed' : doc.stage}</span>
        <span className="doc-kind">{doc.kind}</span>
        <span className="muted small">Dated {formatDate(letter.date)}</span>
      </div>

      <StepTrack doc={doc} />

      <section className="doc-file">
        <span className="scan-icon">
          <FileScan size={18} />
        </span>
        <div>
          <strong>{doc.nas.split('\\').pop()}</strong>
          <span className="doc-nas" title={doc.nas}>
            <HardDrive size={12} /> {doc.nas.slice(0, doc.nas.lastIndexOf('\\'))}
          </span>
        </div>
        <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`} title="Open the scan">
          <Download size={16} />
        </button>
      </section>

      {title && (
        <section className={`doc-step ${doc.rescan ? 'is-rescan' : ''}`}>
          <h3>{title}</h3>
          {!canAct ? (
            <p className="doc-step-note">The Project Coordinator or the Admin does this step.</p>
          ) : doc.rescan ? (
            <RescanStep doc={doc} />
          ) : doc.stage === 'To verify' ? (
            <VerifyStep doc={doc} blocked={verifyBlock(doc, user.name)} />
          ) : doc.stage === 'To authorize' ? (
            <AuthorizeStep doc={doc} />
          ) : doc.stage === 'To share' ? (
            <ShareStep doc={doc} />
          ) : doc.stage === 'To dispatch' ? (
            <DispatchStep doc={doc} />
          ) : (
            <ReceiveStep doc={doc} />
          )}
        </section>
      )}

      <section className="app-section">
        <h3 className="doc-section-head">
          Linked to
          {canAct && !editingLinks && (
            <button className="link-button" onClick={() => setEditingLinks(true)}>
              <Link2 size={14} /> Edit
            </button>
          )}
        </h3>
        {editingLinks ? (
          <LinksForm doc={doc} onDone={() => setEditingLinks(false)} />
        ) : (
          <dl>
            {links.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {record.access && (
        <section className="app-section">
          <h3>Access &amp; original</h3>
          <dl>
            <div>
              <dt>Who can open it</dt>
              <dd>{accessLabel(record.access, record.links, vendors)}</dd>
            </div>
            <div>
              <dt>With the client</dt>
              <dd>{!record.access.client ? 'Not shared — office only' : letter.sharedOn ? `Shared ${formatNearDate(letter.sharedOn)}` : 'In the portal, not told yet'}</dd>
            </div>
            <div>
              <dt>Paper original</dt>
              <dd>
                {!dispatch || dispatch.status === 'Not needed' ? (
                  'Not sent'
                ) : (
                  <>
                    <span className={`pill status-pill ${DISPATCH_TONE[dispatch.status]}`}>{dispatch.status}</span>
                    {dispatch.on && (
                      <span className="doc-dispatch-line">
                        {dispatch.mode}
                        {dispatch.docket && ` · ${dispatch.docket}`} · {formatNearDate(dispatch.on)}
                        {dispatch.receivedOn && `, received ${formatNearDate(dispatch.receivedOn)} by ${dispatch.receivedBy ?? lead.contactPerson}`}
                      </span>
                    )}
                  </>
                )}
              </dd>
            </div>
          </dl>
          {canAct && doc.stage === 'Done' && record.access.client && (!dispatch || dispatch.status === 'Not needed') && <SendOriginal doc={doc} />}
        </section>
      )}

      <section className="app-section">
        <h3>Audit trail</h3>
        <ol className="doc-trail">
          {[...record.events].reverse().map((e, i) => (
            <li key={`${e.at}-${i}`}>
              <span className="doc-trail-dot">{i === 0 ? <CheckCircle2 size={13} /> : null}</span>
              <div>
                <b>{e.text}</b>
                <span className="muted small">
                  {e.by} · {formatDate(e.at.slice(0, 10))}, {timeOf(e.at)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </SideDrawer>
  )
}

function SendOriginal({ doc }) {
  const { requestDispatch } = useCrm()
  return (
    <button className="link-button doc-send-original" onClick={() => requestDispatch(doc, true)}>
      <Send size={14} /> Send the original to the client
    </button>
  )
}
