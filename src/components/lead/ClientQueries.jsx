import { MessageSquareReply } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../../context/crm'
import { queriesOf } from '../../data/queries'
import { formatNearDate } from '../../utils/date'

function ReplyForm({ lead, query }) {
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
            <li key={q.id} className={q.status === 'Open' ? 'is-open' : ''}>
              <div className="query-head">
                <span className={`pill status-pill ${q.status === 'Open' ? 'tone-attention' : 'tone-good'}`}>{q.status}</span>
                <span className="muted">
                  {q.topic} · asked {formatNearDate(q.at.slice(0, 10))}
                </span>
              </div>
              <p>{q.message}</p>
              {q.status === 'Open' ? (
                <ReplyForm lead={lead} query={q} />
              ) : (
                <p className="query-answer">
                  <b>{q.repliedBy}:</b> {q.reply}
                  <span className="muted"> · {formatNearDate(q.repliedAt.slice(0, 10))}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
