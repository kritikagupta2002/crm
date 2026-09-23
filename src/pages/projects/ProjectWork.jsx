import { Download, Eye, EyeOff, File, FileImage, FilePlus2, FileSpreadsheet, FileText, Landmark, MapPin, Plus, ScrollText, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Checklist } from '../../components/common/Checklist'
import { useAccess, useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { SUBMISSION_MODES } from '../../data/projects'
import { formatDayMonth, formatNearDate, toISODate } from '../../utils/date'
import { downloadDocument, downloadLetter } from '../../utils/files'
import { DOC_CATEGORIES, canActOn } from '../../utils/projects'
import { LetterForm } from '../clients/ProjectPanel'

const todayISO = toISODate(TODAY)
const MAX_SIZE = 10 * 1024 * 1024
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

function FileIcon({ file }) {
  if (file.type?.startsWith('image/')) return <FileImage size={18} />
  if (/sheet|excel|csv/.test(file.type) || /\.(xlsx?|csv)$/i.test(file.name)) return <FileSpreadsheet size={18} />
  if (/pdf|word|document|text/.test(file.type) || /\.(pdf|docx?)$/i.test(file.name)) return <FileText size={18} />
  return <File size={18} />
}

/* One file in a list: icon, name, size and date, with download, sharing with the client and remove, where allowed. */
function FileRow({ file, date, note, onRemove, onShare }) {
  const { settings } = useCrm()
  return (
    <li>
      <span className="doc-icon">
        <FileIcon file={file} />
      </span>
      <div>
        <strong>{file.name}</strong>
        <span className="muted">
          {formatSize(file.size)} · {formatDayMonth(file.addedOn ?? date)}
          {note && ` · ${note}`}
        </span>
      </div>
      {onShare !== undefined && (
        <button
          className={`share-toggle ${file.shared ? 'is-on' : ''}`}
          onClick={onShare ?? undefined}
          disabled={!onShare}
          aria-pressed={file.shared}
          title={file.shared ? 'The client can download this from the portal' : 'Only the team can see this'}
        >
          {file.shared ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="share-label">{file.shared ? 'Client can see' : 'Team only'}</span>
        </button>
      )}
      <button className="icon-button small" onClick={() => downloadDocument({ ...file, addedOn: file.addedOn ?? date }, { company: file.company ?? '', companyName: settings.companyName })} aria-label={`Download ${file.name}`}>
        <Download size={15} />
      </button>
      {onRemove && (
        <button className="icon-button small" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <Trash2 size={15} />
        </button>
      )}
    </li>
  )
}

/* Files picked in a form: small and under 10 MB each. */
function useFilePicker() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const pick = (list) => {
    const all = [...list]
    const tooBig = all.filter((f) => f.size > MAX_SIZE)
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} over 10 MB, skipped.` : '')
    setFiles(all.filter((f) => f.size <= MAX_SIZE))
  }
  return { files, error, pick }
}

/* ---------- Stage actions ---------- */

/* Filing with the authority: when, how, the acknowledgement number and what was filed. */
export function SubmissionForm({ project }) {
  const { submitToAuthority } = useCrm()
  const [date, setDate] = useState(todayISO)
  const [mode, setMode] = useState(project.submissionInfo.mode)
  const [ackNo, setAckNo] = useState('')
  const { files, error, pick } = useFilePicker()

  return (
    <form
      className="letter-form submission-form"
      onSubmit={(e) => {
        e.preventDefault()
        submitToAuthority(project.lead.id, project, { date, mode, ackNo: ackNo.trim(), files })
      }}
    >
      <label className="field">
        <span className="field-label">Submitted on</span>
        <input type="date" value={date} max={todayISO} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="field">
        <span className="field-label">Submitted via</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {SUBMISSION_MODES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Acknowledgement / application no.</span>
        <input value={ackNo} onChange={(e) => setAckNo(e.target.value)} placeholder={`e.g. ${project.refBase}/ACK`} />
      </label>
      <label className="field">
        <span className="field-label">Documents filed (optional)</span>
        <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.kml,.kmz,.dwg,image/*" onChange={(e) => pick(e.target.files)} />
        {error && <span className="field-error">{error}</span>}
      </label>
      <div className="letter-form-actions">
        <span className="muted small">Filing with {project.authority}</span>
        <button type="submit" className="btn btn-primary" disabled={!date}>
          <Landmark size={14} /> Mark as submitted
        </button>
      </div>
    </form>
  )
}

/* Last stage: the hand-over checklist, then the project is closed. */
export function ClosurePanel({ project }) {
  const { setClosureStep, closeProject } = useCrm()
  const [note, setNote] = useState('')
  const steps = project.closure.steps
  const ready = steps.every((s) => s.done)

  return (
    <div className="closure-panel">
      <Checklist
        steps={steps}
        values={Object.fromEntries(steps.map((s) => [s.key, s.done]))}
        onToggle={(key, value) => setClosureStep(project.lead.id, project, key, value, steps.find((s) => s.key === key).label)}
      />
      <form
        className="closure-close"
        onSubmit={(e) => {
          e.preventDefault()
          closeProject(project.lead.id, project, note.trim())
        }}
      >
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Closing note (optional), e.g. client happy, repeat work likely" aria-label="Closing note" />
        <button type="submit" className="btn btn-primary" disabled={!ready}>
          Close project
        </button>
      </form>
      {!ready && <p className="muted small">Tick all {steps.length} steps to close the project.</p>}
    </div>
  )
}

/* ---------- Field Work tab ---------- */

const WORK_SUGGESTIONS = ['Geological mapping', 'Sample collection', 'Core drilling & logging', 'DGPS pillar survey', 'Drone flight & GCP marking', 'Water level survey of wells', 'Pumping test', 'Baseline air & water sampling', 'Slope face mapping', 'Site inspection']

export function FieldVisitForm({ project, onDone, by }) {
  const { addFieldVisit } = useCrm()
  const people = [...new Set([...(project.team.members ?? []), project.team.teamLead, by])].filter(Boolean)
  const [form, setForm] = useState({ date: todayISO, by: by ?? people[0] ?? '', activity: '', location: project.site.split(',')[0], notes: '' })
  const { files, error, pick } = useFilePicker()
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <form
      className="letter-form visit-form"
      onSubmit={(e) => {
        e.preventDefault()
        addFieldVisit(project.lead.id, project, { ...form, activity: form.activity.trim(), location: form.location.trim(), notes: form.notes.trim(), files })
        onDone()
      }}
    >
      <label className="field">
        <span className="field-label">Work done</span>
        <input value={form.activity} onChange={set('activity')} list="field-work-list" placeholder="e.g. Sample collection" required autoFocus />
        <datalist id="field-work-list">
          {WORK_SUGGESTIONS.map((w) => (
            <option key={w} value={w} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span className="field-label">Visit date</span>
        <input type="date" value={form.date} max={todayISO} onChange={set('date')} required />
      </label>
      <label className="field">
        <span className="field-label">Done by</span>
        <select value={form.by} onChange={set('by')} required>
          <option value="">Choose…</option>
          {people.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Location on site</span>
        <input value={form.location} onChange={set('location')} placeholder="e.g. Pit 3, north block" />
      </label>
      <label className="field field-wide">
        <span className="field-label">Notes & readings</span>
        <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="What was done, readings taken, anything the team lead should know" />
      </label>
      <label className="field field-wide">
        <span className="field-label">Photos & data files (optional)</span>
        <input type="file" multiple accept="image/*,.csv,.xls,.xlsx,.pdf,.kml,.kmz,.dwg,.txt" onChange={(e) => pick(e.target.files)} />
        {error && <span className="field-error">{error}</span>}
      </label>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!form.activity.trim() || !form.by}>
          Save visit
        </button>
      </div>
    </form>
  )
}

export function FieldWorkTab({ project }) {
  const [adding, setAdding] = useState(false)
  const visits = project.fieldVisits
  const fileCount = visits.reduce((n, v) => n + v.files.length, 0)
  const canLog = Boolean(project.team.teamLead || project.team.members?.length)
  // Field work is logged by the people doing it (and the Coordinator / Admin); Management and Accounts only read it.
  const mayLog = canActOn(useAccess().role, 'work')

  return (
    <div className="field-work">
      <div className="tasks-head">
        <span>
          <b>{visits.length}</b> visit{visits.length === 1 ? '' : 's'} · {fileCount} file{fileCount === 1 ? '' : 's'}
        </span>
        {!adding && canLog && mayLog && (
          <button className="btn btn-small" onClick={() => setAdding(true)}>
            <Plus size={14} /> Log field visit
          </button>
        )}
      </div>
      {!canLog && mayLog && <p className="muted small">Field visits can be logged once the team lead and field team are chosen.</p>}
      {adding && <FieldVisitForm project={project} onDone={() => setAdding(false)} />}

      {visits.length === 0 ? (
        canLog && !adding && <p className="muted small">No field visits yet. Log each visit with its photos and readings.</p>
      ) : (
        <ol className="visit-list">
          {visits.map((v) => (
            <li key={v.id}>
              <span className="visit-date">
                <b>{v.date.slice(8, 10)}</b>
                {formatDayMonth(v.date).split(' ')[1]}
              </span>
              <div>
                <strong>{v.activity}</strong>
                <span className="muted">
                  {v.by}
                  {v.location && (
                    <>
                      {' '}
                      · <MapPin size={12} /> {v.location}
                    </>
                  )}
                </span>
                {v.notes && <p>{v.notes}</p>}
                {v.files.length > 0 && (
                  <ul className="doc-list compact">
                    {v.files.map((f) => (
                      <FileRow key={f.id} file={{ ...f, company: project.lead.company }} date={v.date} />
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/* ---------- Documents tab ---------- */

function Uploader({ project }) {
  const { addProjectDocuments } = useCrm()
  const [category, setCategory] = useState('Report')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const accept = (list) => {
    const files = [...list]
    const tooBig = files.filter((f) => f.size > MAX_SIZE)
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} over 10 MB, skipped.` : '')
    addProjectDocuments(
      project.lead.id,
      project,
      files.filter((f) => f.size <= MAX_SIZE),
      category,
    )
  }

  return (
    <>
      <div
        className={`dropzone project-dropzone ${dragOver ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          accept(e.dataTransfer.files)
        }}
      >
        <UploadCloud size={24} strokeWidth={1.6} />
        <p>
          Add a{' '}
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kind of file">
            {DOC_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>{' '}
          file: drag it here or{' '}
          <button className="link-button" onClick={() => inputRef.current?.click()}>
            browse
          </button>
        </p>
        <span className="muted">Final report, maps, drawings, data sheets — up to 10 MB each</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            accept(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
    </>
  )
}

export function DocumentsTab({ project }) {
  const { removeProjectDocument, setFileShared, settings, role } = useCrm()
  // Coordinators and the Admin decide what the client sees; others see the setting.
  const shareFor = (file) => (canActOn(role, 'submission') ? () => setFileShared(lead.id, project, file, !file.shared) : null)
  const { may } = useAccess()
  const canUpload = may('projects')
  const canFile = canActOn(role, 'approval')
  // false, true (a new letter) or the approval step whose letter gets its scan.
  const [addingLetter, setAddingLetter] = useState(false)
  const lead = project.lead
  const company = lead.company
  const fieldFiles = project.fieldVisits.flatMap((v) => v.files.map((f) => ({ ...f, date: v.date, note: v.activity })))
  const submissionFiles = project.submission?.files ?? []

  return (
    <div className="project-docs">
      {canUpload && <Uploader project={project} />}

      <section>
        <h3>
          Project files <span className="muted">{project.documents.length}</span>
        </h3>
        {project.documents.length ? (
          <ul className="doc-list">
            {project.documents.map((d) => (
              <FileRow key={d.id} file={{ ...d, company }} note={d.category} onShare={shareFor(d)} onRemove={d.seeded || !canUpload ? undefined : () => removeProjectDocument(lead.id, project, d)} />
            ))}
          </ul>
        ) : (
          <p className="muted small">Reports, maps and drawings added here stay with the project.</p>
        )}
      </section>

      <section>
        <h3>
          Field data <span className="muted">{fieldFiles.length}</span>
        </h3>
        {fieldFiles.length ? (
          <ul className="doc-list">
            {fieldFiles.map((f) => (
              <FileRow key={f.id} file={{ ...f, company }} date={f.date} note={f.note} onShare={shareFor(f)} />
            ))}
          </ul>
        ) : (
          <p className="muted small">Photos and readings from field visits appear here.</p>
        )}
      </section>

      <section>
        <h3>
          Government submission <span className="muted">{submissionFiles.length}</span>
        </h3>
        {project.submission ? (
          <>
            <p className="muted small">
              Filed {formatNearDate(project.submission.date)} via {project.submission.mode}
              {project.submission.ackNo && ` · Ack. ${project.submission.ackNo}`}
            </p>
            {submissionFiles.length > 0 && (
              <ul className="doc-list">
                {submissionFiles.map((f) => (
                  <FileRow key={f.id} file={{ ...f, company }} date={project.submission.date} onShare={shareFor(f)} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="muted small">Not submitted yet.</p>
        )}
      </section>

      <section>
        <h3>
          Government letters <span className="muted">{project.letters.length}</span>
        </h3>
        {project.letters.length > 0 && (
          <ul className="letter-list">
            {project.letters.map((letter) => (
              <li key={letter.id}>
                <ScrollText size={16} />
                <span>
                  <strong>{letter.title}</strong>
                  <span className="muted">
                    {letter.stepLabel ? `${letter.stepLabel} · ` : ''}
                    {letter.ref} · {formatNearDate(letter.date)} · {letter.fileId ? 'scan attached' : 'no scan yet'} · {letter.sharedOn ? `client told ${formatNearDate(letter.sharedOn)}` : 'client not told yet'}
                  </span>
                </span>
                {!letter.fileId && letter.stepKey && !addingLetter && canFile && (
                  <button className="btn btn-small" onClick={() => setAddingLetter(letter.stepKey)}>
                    Attach scan
                  </button>
                )}
                <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                  <Download size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {addingLetter ? (
          <LetterForm key={String(addingLetter)} lead={lead} project={project} forStep={typeof addingLetter === 'string' ? addingLetter : ''} onDone={() => setAddingLetter(false)} />
        ) : (
          canFile && (
            <button className="link-button" onClick={() => setAddingLetter(true)}>
              <FilePlus2 size={14} /> Add a government letter
            </button>
          )
        )}
      </section>
    </div>
  )
}
