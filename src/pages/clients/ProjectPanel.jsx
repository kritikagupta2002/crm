import { Download, FilePlus2, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { RoleLink } from '../../components/common/RoleLink'
import { useAccess, useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { formatNearDate, toISODate } from '../../utils/date'
import { downloadLetter } from '../../utils/files'
import { PROJECT_STATUS_TONE, canActOn, clientProjects } from '../../utils/projects'

const doneMap = (steps) => Object.fromEntries(steps.map((s) => [s.key, s.done]))

/*
 * Record a government letter against a project, with its scan. Once the work is filed, the letter can be
 * linked to an approval step (vendor sheet: "link the scanned PDF to the client's task"): the step is marked
 * done and the scan becomes that step's letter, so the client sees one letter with the real copy.
 * forStep: open the form already linked to a step (e.g. "Attach scan" on a letter that has none).
 * scan: a scan from the NAS inbox, which is the letter's copy (no file to choose).
 * links: the lease and vendor it belongs to (Document Management's scan inbox).
 */
export function LetterForm({ lead, project, onDone, forStep: initialStep = '', scan, links }) {
  const { addGovtLetter } = useCrm()
  const submitted = project.milestones[project.milestones.length - 1].done
  const steps = submitted ? project.approvals : []
  const letterFor = (key) => project.letters.find((l) => l.stepKey === key)
  const defaults = (key) => {
    const step = steps.find((s) => s.key === key)
    const existing = key && letterFor(key)
    // Numbered after every letter the approval will bring, so a new letter never shares a reference with one.
    const nextRef = `${project.refBase}/${project.approvals.filter((s) => s.letter).length + project.letters.filter((l) => !l.stepKey).length + 1}`
    return { title: existing?.title ?? step?.letter ?? '', ref: existing?.ref ?? nextRef, date: existing?.date ?? toISODate(TODAY) }
  }
  const [forStep, setForStep] = useState(initialStep)
  const [fields, setFields] = useState(() => defaults(initialStep))
  const [file, setFile] = useState(null)
  const set = (key) => (e) => setFields({ ...fields, [key]: e.target.value })
  const linked = steps.find((s) => s.key === forStep)

  return (
    <form
      className="letter-form"
      onSubmit={(e) => {
        e.preventDefault()
        onDone(addGovtLetter(lead.id, project, { title: fields.title.trim(), authority: project.authority, ref: fields.ref.trim(), date: fields.date, file, scan, forStep: forStep || undefined, links }))
      }}
    >
      {steps.length > 0 && (
        <label className="field field-wide">
          <span className="field-label">Approval step</span>
          <select
            value={forStep}
            onChange={(e) => {
              setForStep(e.target.value)
              setFields(defaults(e.target.value))
            }}
          >
            <option value="">Not linked — a notice, query or other letter</option>
            {steps.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
                {s.done ? (letterFor(s.key)?.fileId ? ' · done, scan attached' : ' · done') : ' · marks it done'}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field field-wide">
        <span className="field-label">Letter</span>
        <input value={fields.title} onChange={set('title')} placeholder="e.g. Site inspection notice" required autoFocus={!initialStep} />
      </label>
      <label className="field">
        <span className="field-label">Reference no.</span>
        <input value={fields.ref} onChange={set('ref')} required />
      </label>
      <label className="field">
        <span className="field-label">Dated</span>
        <input type="date" value={fields.date} max={toISODate(TODAY)} onChange={set('date')} required />
      </label>
      {scan ? (
        <p className="muted small field-wide">
          Scanned copy: <b className="text-ink">{scan.name}</b> from the scanner folder
        </p>
      ) : (
        <label className="field field-wide">
          <span className="field-label">Scanned copy{linked ? '' : ' (optional)'}</span>
          <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0] ?? null)} required={Boolean(linked)} autoFocus={Boolean(initialStep)} />
        </label>
      )}
      {linked && !linked.done && <p className="muted small field-wide">Saving marks “{linked.label}” done on {formatNearDate(fields.date)}; the client sees it once it is verified and shared.</p>}
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={() => onDone(null)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!fields.title.trim() || !fields.ref.trim() || (linked && !file && !scan)}>
          {linked ? 'Save letter & scan' : 'Add letter'}
        </button>
      </div>
    </form>
  )
}

export function ProjectBlock({ lead, project }) {
  const { setProjectStep, settings } = useCrm()
  const { role, may } = useAccess()
  // Work steps are the project team's; approval steps and letters follow the ERM approval stage (Coordinator, Admin).
  const workLocked = may('projects') ? () => null : () => 'Marked by the project team'
  const canFile = canActOn(role, 'approval')
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(null)
  const submitted = project.milestones[project.milestones.length - 1].done
  const toggle = (kind, steps) => (key, value) => setProjectStep(lead.id, project, kind, key, value, steps.find((s) => s.key === key).label.toLowerCase())

  return (
    <article className="project-block">
      <header>
        <div>
          <strong>{project.name}</strong>
          <span className="muted">
            {project.id} · {project.startedOn ? `${project.started ? 'started' : 'starts'} ${formatNearDate(project.startedOn)}` : 'starts after onboarding'}
          </span>
        </div>
        <span className={`pill status-pill ${PROJECT_STATUS_TONE[project.status]}`}>{project.status}</span>
      </header>
      <RoleLink to={`/projects/${project.id}`} className="link-button open-in-erm" hideIfLocked>
        Open in ERM →
      </RoleLink>

      <h4>
        Work <span className="muted">{project.milestonesDone}/{project.milestones.length}</span>
      </h4>
      <ProgressBar done={project.milestonesDone} total={project.milestones.length} tone={submitted ? 'tone-good' : 'tone-info'} />
      <Checklist steps={project.milestones} values={doneMap(project.milestones)} onToggle={toggle('milestones', project.milestones)} locked={workLocked} />

      <h4>
        Government approval <span className="muted">{project.authority}</span>
      </h4>
      <Checklist steps={project.approvals} values={doneMap(project.approvals)} onToggle={toggle('approvals', project.approvals)} disabled={!submitted} locked={canFile ? undefined : () => 'Marked by the Project Coordinator'} />
      {!submitted && <p className="muted small">Opens once the work is submitted to the authority.</p>}

      <h4>
        Government letters <span className="muted">{project.letters.length}</span>
      </h4>
      {project.letters.length > 0 && (
        <ul className="letter-list">
          {project.letters.map((letter) => (
            <li key={letter.id}>
              <ScrollText size={16} />
              <span>
                <strong>{letter.title}</strong>
                <span className="muted">
                  {letter.ref} · {formatNearDate(letter.date)} · {letter.fileId ? 'scan attached' : 'no scan yet'}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* A new letter goes to the client only after it is verified and given its access (Document Management). */}
      {justAdded && (
        <p className="muted small">
          {justAdded.title} is filed; it reaches the client once it is verified.{' '}
          <RoleLink to="/documents?step=To%20verify" className="link-button" hideIfLocked>
            Documents →
          </RoleLink>
        </p>
      )}
      {adding ? (
        <LetterForm
          lead={lead}
          project={project}
          onDone={(letter) => {
            setAdding(false)
            setJustAdded(letter)
          }}
        />
      ) : (
        canFile && (
          <button className="link-button" onClick={() => setAdding(true)}>
            <FilePlus2 size={14} /> Add a government letter
          </button>
        )
      )}
    </article>
  )
}

/* The team's view of a client's projects in the Client Master drawer; what is marked here shows in the client portal. */
export function ProjectPanel({ lead }) {
  const { projectEdits } = useCrm()
  const projects = clientProjects(lead, projectEdits)
  if (projects.length === 0) return null
  return (
    <section className="lead-section">
      <h3>Projects &amp; government approvals</h3>
      <div className="project-stack">
        {projects.map((project) => (
          <ProjectBlock key={project.id} lead={lead} project={project} />
        ))}
      </div>
    </section>
  )
}
