import { MessageSquareReply } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../../context/crm'
import { queriesOf } from '../../data/queries'
import { formatNearDate } from '../../utils/date'
import { answeredByLabel, canAnswer } from '../../utils/questions'

export function ReplyForm({ lead, query }) {
  const { answerQuery } = useCrm()
  const [reply, setReply] = useState('')
  return (
    <form
      className="query-reply"
      onSubmit={(e) => {
        e.preventDefault()
        answerQuery(lead.id, query.id, reply.trim())
      }}
    >
      <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write the answer the client will see on the portal" aria-label={`Reply to ${query.topic} question`} />
      <button type="submit" className="btn btn-primary btn-small" disabled={!reply.trim()}>
        <MessageSquareReply size={14} /> Send reply
      </button>
    </form>
  )
}

/* One question: open ones take a reply from whoever answers that topic (utils/questions); others see who it waits for. */
export function QueryItem({ lead, query, head }) {
  const { role, user, projectEdits } = useCrm()
  const open = query.status === 'Open'
  return (
    <li className={open ? 'is-open' : ''}>
      <div className="query-head">
        <span className={`pill status-pill ${open ? 'tone-attention' : 'tone-good'}`}>{query.status}</span>
        {head}
        <span className="muted">
          {query.topic} · asked {formatNearDate(query.at.slice(0, 10))}
        </span>
      </div>
      <p>{query.message}</p>
      {open ? (
        canAnswer({ role, userName: user.name, projectEdits }, lead, query.topic) ? (
          <ReplyForm lead={lead} query={query} />
        ) : (
          <p className="muted small">Waiting for a reply from {answeredByLabel(lead, query.topic)}.</p>
        )
      ) : (
        <p className="query-answer">
          <b>{query.repliedBy}:</b> {query.reply}
          <span className="muted"> · {formatNearDate(query.repliedAt.slice(0, 10))}</span>
        </p>
      )}
    </li>
  )
}

/* Questions the client asked from the portal; open ones take a reply here, which the client then sees. */
export function ClientQueries({ lead }) {
  const queries = queriesOf(lead)
  const open = queries.filter((q) => q.status === 'Open').length
  return (
    <>
      <h3>
        Client questions <span className="muted">{open ? `${open} waiting for a reply` : queries.length ? 'all answered' : ''}</span>
      </h3>
      {queries.length === 0 ? (
        <p className="muted small">No questions from the client yet. Anything they ask from the portal comes here.</p>
      ) : (
        <ul className="query-list">
          {queries.map((q) => (
            <QueryItem key={q.id} lead={lead} query={q} />
          ))}
        </ul>
      )}
    </>
  )
}
