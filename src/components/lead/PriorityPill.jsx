/* High = red, Medium = amber, Low = neutral — same colour code as the rest of the app. */
const PRIORITY_TONE = { High: 'tone-urgent', Medium: 'tone-attention', Low: 'tone-neutral' }

export function PriorityPill({ priority }) {
  if (!priority) return null
  return (
    <span className={`pill priority-pill ${PRIORITY_TONE[priority]}`}>
      <i aria-hidden="true" />
      {priority} priority
    </span>
  )
}
