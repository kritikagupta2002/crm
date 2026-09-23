import { ArrowLeft, Check, Download, ExternalLink, FileDown, HardHat, Landmark, ListChecks, MapPin, Phone, Plus, ScrollText, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { RoleLink } from '../../components/common/RoleLink'
import { useAccess, useCrm, useMoney } from '../../context/crm'
import { COORDINATORS, FIELD_MEMBERS, TEAM_LEADS, titleOf } from '../../data/staff'
import { formatDate, formatNearDate } from '../../utils/date'
import { downloadLetter } from '../../utils/files'
import { downloadProjectReport } from '../../utils/projectReport'
import { PROJECT_STATUS_TONE, TASK_STATUS, allProjects, canActOn } from '../../utils/projects'
import { ClosurePanel, DocumentsTab, FieldWorkTab, SubmissionForm } from './ProjectWork'
import './erm.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'field', label: 'Field Work' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
]

const initials = (name) =>
  name
    .replace(/^Dr\. /, '')
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function Person({ name, role }) {
  if (!name) return <span className="muted">Not assigned</span>
  return (
    <span className="person">
      <span className="avatar small-avatar">{initials(name)}</span>
      <span>
        <strong>{name}</strong>
        <span className="muted">{role ?? titleOf(name)}</span>
      </span>
    </span>
  )
}

/* Coordinator, team lead and field team, editable. `only` limits the form to the fields for the current stage. */
function TeamForm({ project, onSave, onCancel, only }) {
  const [coordinator, setCoordinator] = useState(project.team.coordinator ?? '')
  const [teamLead, setTeamLead] = useState(project.team.teamLead ?? '')
  const [members, setMembers] = useState(project.team.members ?? [])
  const show = (field) => !only || only.includes(field)
  const toggle = (name) => setMembers(members.includes(name) ? members.filter((m) => m !== name) : [...members, name])
  const valid = (!show('coordinator') || coordinator) && (!show('teamLead') || (teamLead && members.length))

  return (
    <form
      className="team-form"
      onSubmit={(e) => {
        e.preventDefault()
        const patch = {}
        if (show('coordinator')) patch.coordinator = coordinator
        if (show('teamLead')) Object.assign(patch, { teamLead, members })
        onSave(patch)
      }}
    >
      {show('coordinator') && (
        <label className="field">
          <span className="field-label">Project coordinator</span>
          <select value={coordinator} onChange={(e) => setCoordinator(e.target.value)} required>
            <option value="">Choose…</option>
            {COORDINATORS.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
      )}
      {show('teamLead') && (
        <>
          <label className="field">
            <span className="field-label">Team lead</span>
            <select value={teamLead} onChange={(e) => setTeamLead(e.target.value)} required>
              <option value="">Choose…</option>
              {TEAM_LEADS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} — {t.title}
                  {t.services.includes(project.service) ? ' (this service)' : ''}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="member-pick">
            <legend className="field-label">Field team</legend>
            {FIELD_MEMBERS.map((m) => (
              <label key={m.name} className={members.includes(m.name) ? 'is-selected' : ''}>
                <input type="checkbox" checked={members.includes(m.name)} onChange={() => toggle(m.name)} />
                <strong>{m.name}</strong>
                <span>{m.skills}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}
      <div className="team-form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Save
        </button>
      </div>
    </form>
  )
}

/* The stages, and the one thing to do next right under them. */
function StageCard({ project, onOpenTab }) {
  const { setProjectTeam, setProjectStep, role } = useCrm()
  const lead = project.lead
  const current = project.stages[project.stageIndex]
  const owners = {
    allocation: 'Admin',
    planning: project.team.coordinator,
    tasks: project.team.teamLead,
    work: project.team.members?.join(', '),
    submission: project.team.coordinator,
    approval: project.authority,
    closure: project.team.coordinator,
  }
  const standard = project.tasks.filter((t) => t.standard)
  const workTasks = standard.filter((t) => t.key !== 'submission')

  return (
    <section className="card stage-card">
      <ol className="erm-stages">
        {project.stages.map((st, i) => (
          <li key={st.key} className={st.done ? 'is-done' : i === project.stageIndex ? 'is-current' : ''}>
            <span className="erm-dot">{st.done ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
            <strong>{st.label}</strong>
            <span className="muted">{owners[st.key] || st.owner}</span>
          </li>
        ))}
      </ol>

      <div className="stage-next">
        {!current ? (
          <p className="stage-done-note">
            <Check size={16} /> Project closed {formatNearDate(project.closure.closedOn)} — {project.authority} approval received
            {project.closure.note && `. ${project.closure.note}`}
          </p>
        ) : (
          <>
            <div className="stage-next-head">
              <span className="pill status-pill tone-attention">Now: {current.label}</span>
              <span className="muted">{current.todo}</span>
            </div>
            {!canActOn(role, current.key) ? (
              <p className="stage-line muted">
                Waiting on {owners[current.key] || current.owner}. As {role} you can follow this stage; the {current.owner.toLowerCase()} makes the hand-over.
              </p>
            ) : (
              <>
                {current.key === 'allocation' && <TeamForm project={project} only={['coordinator']} onSave={(patch) => setProjectTeam(lead.id, project, patch)} />}
                {current.key === 'planning' && <TeamForm project={project} only={['teamLead']} onSave={(patch) => setProjectTeam(lead.id, project, patch)} />}
                {current.key === 'tasks' && (
                  <p className="stage-line">
                    {standard.filter((t) => !t.assignee).length} task(s) have no owner yet.{' '}
                    <button className="link-button" onClick={() => onOpenTab('tasks')}>
                      Assign in Tasks
                    </button>
                  </p>
                )}
                {current.key === 'work' && (
                  <div className="stage-line">
                    <ProgressBar done={workTasks.filter((t) => t.status === 'done').length} total={workTasks.length} tone="tone-info" />
                    <span>
                      {workTasks.filter((t) => t.status === 'done').length} of {workTasks.length} work tasks done
                      {project.tasks.some((t) => t.overdue) && <b className="text-red"> · {project.tasks.filter((t) => t.overdue).length} overdue</b>}
                    </span>
                    <button className="link-button" onClick={() => onOpenTab('tasks')}>
                      Open tasks
                    </button>
                    <span className="muted">·</span>
                    <span>
                      {project.fieldVisits.length} field visit{project.fieldVisits.length === 1 ? '' : 's'} logged
                    </span>
                    <button className="link-button" onClick={() => onOpenTab('field')}>
                      Log a visit
                    </button>
                  </div>
                )}
                {current.key === 'submission' && <SubmissionForm key={project.id} project={project} />}
                {current.key === 'approval' && (
                  <div className="stage-approvals">
                    <Checklist
                      steps={project.approvals}
                      values={Object.fromEntries(project.approvals.map((a) => [a.key, a.done]))}
                      onToggle={(key, value) => setProjectStep(lead.id, project, 'approvals', key, value, project.approvals.find((a) => a.key === key).label.toLowerCase())}
                    />
                  </div>
                )}
                {current.key === 'closure' && <ClosurePanel key={project.id} project={project} />}
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function TasksTab({ project }) {
  const { updateProjectTask, addProjectTask } = useCrm()
  const readOnly = !useAccess().may('projects')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ title: '', assignee: '', due: '' })
  const lead = project.lead
  const done = project.tasks.filter((t) => t.status === 'done').length
  const teamNames = [project.team.coordinator, project.team.teamLead, ...(project.team.members ?? [])].filter(Boolean)

  const ownerSelect = (value, onChange, label) => (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} aria-label={label} disabled={readOnly}>
      <option value="">Unassigned</option>
      {teamNames.length > 0 && (
        <optgroup label="Project team">
          {teamNames.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </optgroup>
      )}
      <optgroup label="Everyone else">
        {[...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS]
          .filter((p) => !teamNames.includes(p.name))
          .map((p) => (
            <option key={p.name}>{p.name}</option>
          ))}
      </optgroup>
    </select>
  )

  return (
    <div className="tasks-tab">
      <div className="tasks-head">
        <span>
          <b>{done}</b> of {project.tasks.length} done
        </span>
        <ProgressBar done={done} total={project.tasks.length} tone={done === project.tasks.length ? 'tone-good' : 'tone-info'} />
        {!adding && !readOnly && (
          <button className="btn btn-small" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add task
          </button>
        )}
      </div>

      {adding && (
        <form
          className="task-add"
          onSubmit={(e) => {
            e.preventDefault()
            addProjectTask(lead.id, project, { ...draft, title: draft.title.trim() })
            setDraft({ title: '', assignee: '', due: '' })
            setAdding(false)
          }}
        >
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Collect 20 core samples from pit 3" aria-label="Task" autoFocus required />
          {ownerSelect(draft.assignee, (v) => setDraft({ ...draft, assignee: v ?? '' }), 'Owner')}
          <input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} aria-label="Due date" />
          <button type="button" className="btn" onClick={() => setAdding(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!draft.title.trim()}>
            Add
          </button>
        </form>
      )}

      <div className="table-wrap">
        <table className="data-table task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {project.tasks.map((t) => (
              <tr key={t.key ?? t.id} className={t.status === 'done' ? 'is-done' : ''}>
                <td>
                  <div className="cell-strong">{t.title}</div>
                  <div className="cell-sub">{t.standard ? 'Standard step · shown to the client' : 'Added by the team'}</div>
                </td>
                <td>{ownerSelect(t.assignee, (v) => updateProjectTask(lead.id, project, t, { assignee: v }), `Owner of ${t.title}`)}</td>
                <td>
                  <input
                    type="date"
                    className={t.overdue ? 'is-overdue' : undefined}
                    value={t.due ?? ''}
                    onChange={(e) => updateProjectTask(lead.id, project, t, { due: e.target.value || null })}
                    aria-label={`Due date of ${t.title}`}
                    disabled={t.status === 'done' || readOnly}
                  />
                  {t.overdue && <div className="cell-sub text-red">Overdue</div>}
                  {t.status === 'done' && t.doneOn && <div className="cell-sub">Done {formatNearDate(t.doneOn)}</div>}
                </td>
                <td>
                  <select className={`task-status status-${t.status}`} value={t.status} onChange={(e) => updateProjectTask(lead.id, project, t, { status: e.target.value })} aria-label={`Status of ${t.title}`} disabled={readOnly}>
                    {Object.entries(TASK_STATUS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OverviewTab({ project }) {
  const { setProjectTeam, settings, role } = useCrm()
  const money = useMoney()
  const [editing, setEditing] = useState(false)
  const lead = project.lead
  const current = project.tasks.find((t) => t.status !== 'done')
  const submitted = project.tasks.find((t) => t.key === 'submission' && t.status === 'done')

  return (
    <div className="project-overview">
      <section className="ov-block">
        <div className="ov-head">
          <h3>
            <Users size={16} /> Team
          </h3>
          {!editing && project.team.coordinator && canActOn(role, 'planning') && (
            <button className="link-button" onClick={() => setEditing(true)}>
              Change
            </button>
          )}
        </div>
        {editing ? (
          <TeamForm
            project={project}
            onCancel={() => setEditing(false)}
            onSave={(patch) => {
              setProjectTeam(lead.id, project, patch)
              setEditing(false)
            }}
          />
        ) : (
          <dl className="team-list-erm">
            <div>
              <dt>Coordinator</dt>
              <dd>
                <Person name={project.team.coordinator} />
              </dd>
            </div>
            <div>
              <dt>Team lead</dt>
              <dd>
                <Person name={project.team.teamLead} />
              </dd>
            </div>
            <div>
              <dt>Field team</dt>
              <dd className="member-list">{project.team.members?.length ? project.team.members.map((m) => <Person key={m} name={m} />) : <span className="muted">Not assigned</span>}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="ov-block">
        <h3>
          <ListChecks size={16} /> Key dates
        </h3>
        <dl className="detail-list">
          <div>
            <dt>Started</dt>
            <dd>{project.startedOn ? `${formatDate(project.startedOn)}${project.started ? '' : ' (planned)'}` : 'After onboarding'}</dd>
          </div>
          <div>
            <dt>{submitted?.doneOn ? 'Submitted' : 'Submission planned'}</dt>
            <dd>{submitted?.doneOn ? formatDate(submitted.doneOn) : project.dueOn ? formatDate(project.dueOn) : '—'}</dd>
          </div>
          {project.closure.closedOn && (
            <div>
              <dt>Closed</dt>
              <dd>{formatDate(project.closure.closedOn)}</dd>
            </div>
          )}
          {!['Approved', 'Completed'].includes(project.status) && (
            <div>
              <dt>Current task</dt>
              <dd>{current ? `${current.title}${current.due ? ` · due ${formatNearDate(current.due)}` : ''}` : 'All tasks done'}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="ov-block">
        <h3>
          <MapPin size={16} /> Client &amp; site
        </h3>
        <dl className="detail-list">
          <div>
            <dt>Client</dt>
            <dd>
              <RoleLink to={`/leads/${lead.id}`}>{lead.company}</RoleLink>
            </dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{lead.contactPerson}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {lead.phone ? (
                <a href={`tel:+91${lead.phone}`}>
                  <Phone size={13} /> +91 {lead.phone.slice(0, 5)} {lead.phone.slice(5)}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>{project.site}</dd>
          </div>
        </dl>
      </section>

      <section className="ov-block">
        <h3>
          <Landmark size={16} /> Government approval
        </h3>
        <p className="muted small">
          {project.authority}
          {project.submission && (
            <>
              <br />
              Filed {formatNearDate(project.submission.date)} via {project.submission.mode}
              {project.submission.ackNo && ` · Ack. ${project.submission.ackNo}`}
            </>
          )}
        </p>
        <ol className="approval-steps">
          {project.approvals.map((a) => (
            <li key={a.key} className={a.done ? 'is-done' : ''}>
              <span className="erm-dot small">{a.done && <Check size={11} strokeWidth={3} />}</span>
              <span>{a.label}</span>
              <span className="muted">{a.date ? (a.done ? formatNearDate(a.date) : `planned ${formatNearDate(a.date)}`) : ''}</span>
            </li>
          ))}
        </ol>
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
      </section>

      <section className="ov-block">
        <div className="ov-head">
          <h3>
            <HardHat size={16} /> Subcontracts
          </h3>
          <RoleLink to="/subcontracts" className="link-button" hideIfLocked>
            All subcontracts
          </RoleLink>
        </div>
        {project.workOrders.length ? (
          <ul className="letter-list">
            {project.workOrders.map((w) => (
              <li key={w.id}>
                <HardHat size={16} />
                <span>
                  <strong>
                    {w.vendor} — {w.work}
                  </strong>
                  <span className="muted">
                    {w.id} · {money.full(w.amount)} · due {formatNearDate(w.dueOn)} · {w.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No outside firm on this project. Drilling, lab tests or drone work given out are listed here.</p>
        )}
      </section>
    </div>
  )
}

/* The project's history: what happened on it, from creation to closure, newest first. */
function HistoryTab({ project }) {
  const { activities } = useCrm()
  const logged = activities
    .filter((a) => a.leadId === project.lead.id && a.type === 'project' && (a.text.includes(project.id) || a.text.startsWith(`${project.name}`)))
    .map((a) => ({ id: a.id, date: a.at.slice(0, 10), sort: a.at, text: a.text.replace(`${project.name} (${project.id}) — `, '').replace(`${project.name}: `, '') }))
  const items = [...logged, ...project.history.map((h) => ({ ...h, sort: `${h.date}T00:00` }))].sort((a, b) => b.sort.localeCompare(a.sort))
  if (items.length === 0) return <p className="muted small">Nothing recorded yet. Team changes, task updates, visits and letters appear here.</p>
  return (
    <ol className="timeline">
      {items.map((a) => (
        <li key={a.id} className="timeline-item type-project">
          <span className="timeline-dot" />
          <div>
            <p>{a.text}</p>
            <span className="muted">{formatNearDate(a.date)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* One project in the ERM: its stage, the next hand-over, the team, the tasks and the approval. */
export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { leads, projectEdits, activities, settings } = useCrm()
  const [params, setParams] = useSearchParams()
  const project = allProjects(leads, projectEdits).find((p) => p.id === projectId)
  const asked = params.get('tab') === 'activity' ? 'history' : params.get('tab') // the tab's old name
  const tab = TABS.some((t) => t.id === asked) ? asked : 'overview'
  const openTab = (id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })

  if (!project) {
    return (
      <div className="card coming-soon">
        <h1>Project not found</h1>
        <p className="muted">There's no project with the ID {projectId}.</p>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    )
  }

  const openTasks = project.tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="project-page">
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} /> Projects
      </Link>

      <header className="page-header lead-header">
        <div className="page-title">
          <h1>{project.name}</h1>
          <p className="lead-meta">
            <span className="mono-sub">{project.id}</span>
            <span className={`pill status-pill ${PROJECT_STATUS_TONE[project.status]}`}>{project.status}</span>
            <span className="muted">
              {project.lead.company} · {project.site}
            </span>
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => downloadProjectReport(project, { activities, companyName: settings.companyName })}>
            <FileDown size={15} /> Project report
          </button>
          <Link className="btn" to={`/portal?lead=${project.lead.id}`}>
            <ExternalLink size={15} /> Client portal view
          </Link>
        </div>
      </header>

      <StageCard project={project} onOpenTab={openTab} />

      <section className="card details-main">
        <nav className="details-tabs" aria-label="Project sections">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => openTab(t.id)}>
              {t.label}
              {t.id === 'tasks' && openTasks > 0 && <span>{openTasks}</span>}
            </button>
          ))}
        </nav>
        <div key={tab} className="details-panel tab-panel">
          {tab === 'overview' && <OverviewTab project={project} />}
          {tab === 'tasks' && <TasksTab project={project} />}
          {tab === 'field' && <FieldWorkTab project={project} />}
          {tab === 'documents' && <DocumentsTab project={project} />}
          {tab === 'history' && <HistoryTab project={project} />}
        </div>
      </section>
    </div>
  )
}

