import { Download, FilePlus2, MessageCircle, ScrollText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePaged } from '../../components/common/Pager'
import { useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { downloadLetter } from '../../utils/files'
import { whatsappLink } from '../../utils/whatsapp'
import { LetterForm } from '../clients/ProjectPanel'

const TABS = { 'To share': (r) => !r.letter.sharedOn, Shared: (r) => Boolean(r.letter.sharedOn), All: () => true }

/*
 * Every official letter across the projects: record a scanned letter against its project, then tell the
 * client on WhatsApp. The client portal shows a letter as soon as it is recorded. ?letters=<tab> opens
 * the card on that tab and scrolls to it (the stat card and old /letters links use this).
 */
export function LettersCard({ projects }) {
  const { settings, markLetterShared } = useCrm()
  const [params, setParams] = useSearchParams()
  const [recording, setRecording] = useState(false)
  const [projectId, setProjectId] = useState('')
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

  const rows = projects.flatMap((p) => p.letters.map((letter) => ({ letter, project: p }))).sort((a, b) => b.letter.date.localeCompare(a.letter.date))
  const visible = rows.filter(TABS[tab])
  const { rows: pageRows, pager } = usePaged(visible, 6, tab)
  const filed = projects.filter((p) => p.submission)
  const target = filed.find((p) => p.id === projectId)

  const message = (letter, project) =>
    `Dear ${project.lead.contactPerson}, we have received the ${letter.title} (${letter.ref}) from ${letter.authority} for ${project.name}. You can download it from your client portal: ${window.location.origin}/login — ${settings.companyName}`

  return (
    <section className="card letters-card" ref={ref}>
      <header className="card-header">
        <ScrollText size={18} className="card-icon" />
        <h2>Government letters</h2>
        <div className="card-actions">
          {!recording && (
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
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} autoFocus>
              <option value="">Choose the project it is for…</option>
              {filed.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lead.company} — {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>
          {target ? (
            <LetterForm
              key={target.id}
              lead={target.lead}
              project={target}
              onDone={() => {
                setRecording(false)
                setProjectId('')
                setTab('To share')
              }}
            />
          ) : (
            <div className="letter-form-actions">
              <button className="btn" onClick={() => setRecording(false)}>
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
              {pageRows.map(({ letter, project }) => (
                <tr key={letter.id}>
                  <td>
                    <div className="cell-strong">{letter.title}</div>
                    <div className="cell-sub">
                      {project.code} · {letter.ref}
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
                    ) : project.lead.phone ? (
                      <a className="btn btn-whatsapp btn-small" target="_blank" rel="noreferrer" href={whatsappLink(project.lead.phone, message(letter, project))} onClick={() => markLetterShared(project.lead.id, project, letter)}>
                        <MessageCircle size={14} /> Tell client
                      </a>
                    ) : (
                      <button className="btn btn-small" onClick={() => markLetterShared(project.lead.id, project, letter)}>
                        Mark as shared
                      </button>
                    )}
                  </td>
                  <td className="num">
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
