import { Download, FilePlus2, MessageCircle, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { RoleLink } from '../../components/common/RoleLink'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { formatNearDate, toISODate } from '../../utils/date'
import { downloadLetter } from '../../utils/files'
import { PROJECT_STATUS_TONE, clientProjects } from '../../utils/projects'
import { whatsappLink } from '../../utils/whatsapp'

const doneMap = (steps) => Object.fromEntries(steps.map((s) => [s.key, s.done]))

export function LetterForm({ lead, project, onDone }) {
  const { addGovtLetter } = useCrm()
  const [title, setTitle] = useState('')
  // Numbered after every letter the approval will bring, so a recorded letter never shares a reference with one.
  const [ref, setRef] = useState(`${project.refBase}/${project.approvals.filter((s) => s.letter).length + project.letters.filter((l) => !l.stepKey).length + 1}`)
  const [date, setDate] = useState(toISODate(TODAY))
  const [file, setFile] = useState(null)

  return (
    <form
      className="letter-form"
      onSubmit={(e) => {
        e.preventDefault()
        onDone(addGovtLetter(lead.id, project, { title: title.trim(), authority: project.authority, ref: ref.trim(), date, file }))
      }}
    >
      <label className="field field-wide">
        <span className="field-label">Letter</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Site inspection notice" required autoFocus />
      </label>
      <label className="field">
        <span className="field-label">Reference no.</span>
        <input value={ref} onChange={(e) => setRef(e.target.value)} required />
      </label>
      <label className="field">
        <span className="field-label">Dated</span>
        <input type="date" value={date} max={toISODate(TODAY)} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="field field-wide">
        <span className="field-label">Scanned copy (optional)</span>
        <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      </label>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={() => onDone(null)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!title.trim() || !ref.trim()}>
          Add letter
        </button>
      </div>
    </form>
  )
}

export function ProjectBlock({ lead, project }) {
  const { setProjectStep, settings } = useCrm()
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
      <Checklist steps={project.milestones} values={doneMap(project.milestones)} onToggle={toggle('milestones', project.milestones)} />

      <h4>
        Government approval <span className="muted">{project.authority}</span>
      </h4>
      <Checklist steps={project.approvals} values={doneMap(project.approvals)} onToggle={toggle('approvals', project.approvals)} disabled={!submitted} />
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
                  {letter.ref} · {formatNearDate(letter.date)}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {justAdded && lead.phone && (
        <a
          className="btn btn-whatsapp btn-small"
          target="_blank"
          rel="noreferrer"
          href={whatsappLink(
            lead.phone,
            `Dear ${lead.contactPerson}, we have received the ${justAdded.title} (${justAdded.ref}) from ${justAdded.authority} for ${project.name}. You can download it from your client portal: ${window.location.origin}/login — ${settings.companyName}`,
          )}
          onClick={() => setJustAdded(null)}
        >
          <MessageCircle size={15} /> Tell the client on WhatsApp
        </a>
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
        <button className="link-button" onClick={() => setAdding(true)}>
          <FilePlus2 size={14} /> Add a government letter
        </button>
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
