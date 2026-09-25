import { ArrowLeft, CheckCircle2, FileScan } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccess, useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { SCAN_FOLDER } from '../../data/scans'
import { formatNearDate } from '../../utils/date'
import { STAGE_TONE } from '../../utils/documents'
import { allProjects } from '../../utils/projects'
import { LetterForm } from '../clients/ProjectPanel'
import { ScanInbox } from '../projects/ScanInbox'
import '../projects/erm.css'
import '../vendors/vendors.css'
import './documents.css'

/* Filing one scan: its project (and so its client), the lease and vendor it concerns, then the letter's details. */
function FileScanForm({ scan, onDone }) {
  const { leads, projectEdits, vendors } = useCrm()
  const [projectId, setProjectId] = useState('')
  const [leaseNo, setLeaseNo] = useState('')
  const [vendorId, setVendorId] = useState('')
  // Letters come at any point of a running project: notices and queries before the filing, approvals after it.
  const open = allProjects(leads, projectEdits).filter((p) => p.started || p.team.coordinator)
  const target = open.find((p) => p.id === projectId)

  return (
    <section className="card doc-filing">
      <header className="card-header">
        <FileScan size={18} className="card-icon" />
        <h2>File {scan.name}</h2>
      </header>
      <div className="record-letter-body">
        <label className="field field-wide">
          <span className="field-label">Project</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} autoFocus>
            <option value="">Choose the project it is for…</option>
            {open.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lead.company} — {p.name} ({p.id})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Lease no. (optional)</span>
          <input value={leaseNo} onChange={(e) => setLeaseNo(e.target.value)} placeholder="e.g. ML 17/2004" />
        </label>
        <label className="field">
          <span className="field-label">Vendor on the work (optional)</span>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">None</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.id})
              </option>
            ))}
          </select>
        </label>
        {target ? (
          <LetterForm
            key={target.id}
            lead={target.lead}
            project={target}
            scan={scan}
            links={{ leaseNo: leaseNo.trim(), vendorId }}
            onDone={(letter) => onDone(letter && { title: letter.title, id: letter.stepKey ? `${target.id}-${letter.stepKey}` : letter.id })}
          />
        ) : (
          <div className="letter-form-actions">
            <button className="btn" onClick={() => onDone(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/*
 * Flowchart steps 1–3: the office scanner saves each government document to the NAS scanner folder; here someone files
 * it against its project, lease and vendor. Filed scans go on to verification (Documents).
 */
export function ScanInboxPage() {
  const { scanInbox, documents } = useCrm()
  const { may } = useAccess()
  const canFile = may('documents')
  const [scan, setScan] = useState(null)
  const [filed, setFiled] = useState(null)
  const weekAgo = new Date(TODAY.getTime() - 7 * 86_400_000).toISOString()
  const recent = documents.filter((d) => d.record.filedAt >= weekAgo).sort((a, b) => b.record.filedAt.localeCompare(a.record.filedAt)).slice(0, 5)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <Link to="/documents" className="back-link">
            <ArrowLeft size={15} /> Documents
          </Link>
          <h1>Scan Inbox</h1>
          <p>
            {scanInbox.length ? `${scanInbox.length} scan${scanInbox.length === 1 ? '' : 's'} to file` : 'Nothing to file'} · <span className="mono-sub">{SCAN_FOLDER}</span>
          </p>
        </div>
      </header>

      {filed && (
        <p className="portal-sent doc-filed-note">
          <CheckCircle2 size={18} /> {filed.title} is filed and waits for verification.{' '}
          <Link to={`/documents?open=${filed.id}`} className="link-button">
            Open it →
          </Link>
        </p>
      )}

      {scan && (
        <FileScanForm
          key={scan.id}
          scan={scan}
          onDone={(done) => {
            setScan(null)
            setFiled(done)
          }}
        />
      )}

      <section className="card">
        <header className="card-header">
          <FileScan size={18} className="card-icon" />
          <h2>Waiting to be filed</h2>
        </header>
        <ScanInbox
          canFile={canFile}
          onFile={(next) => {
            setScan(next)
            setFiled(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </section>

      {recent.length > 0 && (
        <section className="card">
          <header className="card-header">
            <h2>Filed this week</h2>
          </header>
          <ul className="doc-recent">
            {recent.map((d) => (
              <li key={d.id}>
                <Link to={`/documents?open=${d.id}`} className="cell-link">
                  <strong>{d.letter.title}</strong>
                </Link>
                <span className="muted small">
                  {d.lead.company} · {d.project.id} · filed {formatNearDate(d.record.filedAt.slice(0, 10))} by {d.record.filedBy}
                </span>
                <span className={`pill status-pill ${d.rescan ? 'tone-urgent' : STAGE_TONE[d.stage]}`}>{d.rescan ? 'Rescan' : d.stage}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
