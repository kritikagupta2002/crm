import { TODAY } from '../data/mockData'
import { formatDate, toISODate } from './date'
import { downloadBlob } from './files'
import { textPdf } from './pdf'
import { TASK_STATUS } from './projects'

const heading = (text) => ({ text, size: 13, bold: true, gap: 6 })
const line = (text, gap = 3) => ({ text, size: 10.5, gap })
const date = (iso) => (iso ? formatDate(iso) : '-')

/* The whole project on paper: team, stages, tasks, field work, submission, approval, closure and history. */
export function downloadProjectReport(project, { activities, companyName }) {
  const { lead, team } = project
  const logged = activities.filter((a) => a.leadId === lead.id && a.type === 'project' && (a.text.includes(project.id) || a.text.startsWith(project.name))).map((a) => ({ date: a.at.slice(0, 10), sort: a.at, text: a.text }))
  const history = [...project.history.map((h) => ({ ...h, sort: `${h.date}T00:00` })), ...logged].sort((a, b) => a.sort.localeCompare(b.sort))

  const lines = [
    { text: companyName, size: 16, bold: true, gap: 2 },
    { text: `Project report - generated ${formatDate(toISODate(TODAY))}`, size: 10, gap: 16 },
    { text: project.name, size: 18, bold: true, gap: 4 },
    line(`${project.id} - ${project.status} - ${lead.company}, ${project.site}`, 14),

    heading('Project'),
    line(`Service: ${project.service}`),
    line(`Started: ${project.startedOn ? date(project.startedOn) : 'After onboarding'}`),
    line(`Authority: ${project.authority}`),
    line(`Client contact: ${lead.contactPerson}${lead.phone ? `, +91 ${lead.phone}` : ''}`, 12),

    heading('Team'),
    line(`Project coordinator: ${team.coordinator ?? 'Not assigned'}`),
    line(`Team lead: ${team.teamLead ?? 'Not assigned'}`),
    line(`Field team: ${team.members?.length ? team.members.join(', ') : 'Not assigned'}`, 12),

    heading('Stages'),
    ...project.stages.map((st, i) => line(`${i + 1}. ${st.label} - ${st.done ? 'done' : i === project.stageIndex ? 'current' : 'pending'}`)),
    line('', 8),

    heading('Tasks'),
    ...project.tasks.map((t) => line(`${t.title} - ${t.assignee ?? 'Unassigned'} - ${TASK_STATUS[t.status]}${t.status === 'done' && t.doneOn ? ` on ${date(t.doneOn)}` : t.due ? `, due ${date(t.due)}` : ''}`)),
    line('', 8),

    heading(`Field visits (${project.fieldVisits.length})`),
    ...(project.fieldVisits.length
      ? project.fieldVisits.flatMap((v) => [line(`${date(v.date)} - ${v.activity} - ${v.by} - ${v.location}`, 1), line(`   ${v.notes || 'No notes'}${v.files.length ? ` (${v.files.length} files)` : ''}`)])
      : [line('No field visits logged.')]),
    line('', 8),

    heading('Government submission'),
    ...(project.submission
      ? [line(`Submitted on ${date(project.submission.date)} via ${project.submission.mode}`), line(`Acknowledgement no.: ${project.submission.ackNo || '-'}`)]
      : [line('Not submitted yet.')]),
    line('', 8),

    heading('Government approval'),
    ...project.approvals.map((a) => line(`${a.label} - ${a.done ? `done ${date(a.date)}` : 'pending'}`)),
    ...project.letters.map((l) => line(`Letter: ${l.title} (${l.ref}), ${date(l.date)}`)),
    line('', 8),

    heading('Closure'),
    ...project.closure.steps.map((c) => line(`${c.label} - ${c.done ? 'done' : 'pending'}`)),
    line(project.closure.closedOn ? `Project closed on ${date(project.closure.closedOn)}${project.closure.note ? ` - ${project.closure.note}` : ''}` : 'Project not closed yet.', 12),

    heading('History'),
    ...(history.length ? history.map((a) => line(`${date(a.date)} - ${a.text}`)) : [line('Nothing recorded yet.')]),
    { text: '', gap: 16 },
    { text: `Generated from the ${companyName} ERM. Demo document.`, size: 9 },
  ]
  downloadBlob(`${project.id}-project-report.pdf`, textPdf(lines))
}
