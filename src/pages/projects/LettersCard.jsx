import { Download, FilePlus2, FileScan, MessageCircle, ScrollText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePaged } from '../../components/common/Pager'
import { useAccess, useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { STAGE_TONE } from '../../utils/documents'
import { downloadLetter } from '../../utils/files'
import { canActOn } from '../../utils/projects'
import { whatsappLink } from '../../utils/whatsapp'
import { LetterForm } from '../clients/ProjectPanel'

// Letters still on their way to the client (Document Management's steps), those already with the client, and all.
const TABS = { 'To share': (r) => !r.letter.sharedOn && r.doc?.record.access?.client !== false, Shared: (r) => Boolean(r.letter.sharedOn), All: () => true }

/*
 * Every official letter across the projects: record a letter against its project (and, once the work is filed,
 * against the approval step it belongs to). Each letter then goes through Document Management — verified by a
 * second person, given its access, shared — and the client sees it only after that. Scans are filed from the
 * Scan Inbox. ?letters=<tab> opens the card on that tab and scrolls to it (the stat card and old /letters links use this).
 */
export function LettersCard({ projects }) {
  const { settings, shareDocument, scanInbox, documents } = useCrm()
  // Letters go with the approval stage: the Coordinator (or the Admin) records them and tells the client.
  const canFile = canActOn(useAccess().role, 'approval')
  const [params, setParams] = useSearchParams()
  const [recording, setRecording] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [forStep, setForStep] = useState('')
  const ref = useRef(null)
  const asked = params.get('letters')
  const tab = TABS[asked] ? asked : 'To share'

  useEffect(() => {
    if (!asked) return
    // After the layout's own "new page starts at the top" scroll has run.
    const timer = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => clearTimeout(timer)
  }, [asked])

  const setTab = (next) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('letters', next)
    setParams(nextParams, { replace: true })
  }

  const docOf = (id) => documents.find((d) => d.id === id)
  const rows = projects
    .flatMap((p) => p.letters.map((letter) => ({ letter, project: p, doc: docOf(letter.id) })))
    .sort((a, b) => b.letter.date.localeCompare(a.letter.date))
  const visible = rows.filter(TABS[tab])
  const { rows: pageRows, pager } = usePaged(visible, 6, tab)
  // Letters come at any point of a running project: notices and queries before the filing, approvals after it.
  const open = projects.filter((p) => p.started || p.team.coordinator)
  const target = open.find((p) => p.id === projectId)
  const attachScan = (project, letter) => {
    setProjectId(project.id)
    setForStep(letter.stepKey)
    setRecording(true)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const closeRecording = () => {
    setRecording(false)
    setProjectId('')
    setForStep('')
  }

  const message = (letter, project) =>
    `Dear ${project.lead.contactPerson}, we have received the ${letter.title} (${letter.ref}) from ${letter.authority} for ${project.name}. You can download it from your client portal: ${window.location.origin}/login — ${settings.companyName}`

  return (
    <section className="card letters-card" ref={ref}>
      <header className="card-header">
        <ScrollText size={18} className="card-icon" />
        <h2>Government letters</h2>
        <div className="card-actions">
          {!recording && canFile && (
            <button className="btn btn-small" onClick={() => setRecording(true)}>
              <FilePlus2 size={14} /> Record a letter
            </button>
          )}
        </div>
      </header>

      {recording && (
        <div className="record-letter-body">
          <label className="field">
            <span className="field-label">Project</span>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setForStep('')
              }}
              autoFocus={!forStep}
            >
              <option value="">Choose the project it is for…</option>
              {open.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lead.company} — {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>
          {target ? (
            <LetterForm
              key={`${target.id}-${forStep}`}
              lead={target.lead}
              project={target}
              forStep={forStep}
              onDone={(letter) => {
                closeRecording()
                if (letter) setTab('To share')
              }}
            />
          ) : (
            <div className="letter-form-actions">
              <button className="btn" onClick={closeRecording}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <nav className="stage-tabs" aria-label="Filter letters">
        {Object.keys(TABS).map((t) => (
          <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
            {t}
            <span>{rows.filter(TABS[t]).length}</span>
          </button>
        ))}
        {scanInbox.length > 0 && (
          <Link to="/documents/scan-inbox" className="stage-tab letters-inbox-link">
            <FileScan size={14} /> Scan inbox
            <span>{scanInbox.length}</span>
          </Link>
        )}
      </nav>
      {visible.length === 0 ? (
        <p className="empty-state">{tab === 'To share' ? 'Every letter has been shared with its client.' : 'No letters here.'}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Letter</th>
                <th>Project</th>
                <th>Dated</th>
                <th>Client</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ letter, project, doc }) => (
                <tr key={letter.id}>
                  <td>
                    <div className="cell-strong">{letter.title}</div>
                    <div className="cell-sub">
                      {project.code} · {letter.ref} · {letter.fileId ? 'scan attached' : 'no scan yet'}
                    </div>
                  </td>
                  <td>
                    <Link to={`/projects/${project.id}?tab=documents`} className="cell-strong cell-link">
                      {project.lead.company}
                    </Link>
                    <div className="cell-sub">{project.name}</div>
                  </td>
                  <td className="nowrap">{formatNearDate(letter.date)}</td>
                  <td>
                    {letter.sharedOn ? (
                      <span className="pill status-pill tone-good">Shared {formatNearDate(letter.sharedOn)}</span>
                    ) : doc && doc.stage !== 'To share' ? (
                      // Before it can go to the client it is verified and given its access (Document Management).
                      <Link to={`/documents?open=${doc.id}`} className={`pill status-pill ${doc.rescan ? 'tone-urgent' : STAGE_TONE[doc.stage]}`}>
                        {doc.rescan ? 'Rescan' : doc.stage === 'Done' ? 'Office only' : doc.stage}
                      </Link>
                    ) : !canFile || !doc ? (
                      <span className="pill status-pill tone-attention">Not shared yet</span>
                    ) : project.lead.phone ? (
                      <a className="btn btn-whatsapp btn-small" target="_blank" rel="noreferrer" href={whatsappLink(project.lead.phone, message(letter, project))} onClick={() => shareDocument(doc)}>
                        <MessageCircle size={14} /> Tell client
                      </a>
                    ) : (
                      <button className="btn btn-small" onClick={() => shareDocument(doc, 'marked')}>
                        Mark as shared
                      </button>
                    )}
                  </td>
                  <td className="num nowrap">
                    {!letter.fileId && letter.stepKey && canFile && (
                      <button className="btn btn-small" onClick={() => attachScan(project, letter)}>
                        Attach scan
                      </button>
                    )}
                    <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead: project.lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pager}
    </section>
  )
}
