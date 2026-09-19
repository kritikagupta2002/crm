import { useState } from 'react'
import { STAGE_COLORS } from '../../components/common/stageColors'
import { STAGES, TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { formatINR } from '../../utils/format'

const todayISO = toISODate(TODAY)

/*
 * Kanban board: drag a card to another column to change its stage.
 * (Native HTML drag and drop — on touch screens, stages are changed from the lead's detail panel.)
 */
export function LeadsBoard({ leads, onOpen, onMove }) {
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)

  return (
    <div className="board">
      {STAGES.map((stage) => {
        const cards = leads.filter((lead) => lead.stage === stage)
        const total = cards.reduce((sum, lead) => sum + (lead.quoteValue ?? 0), 0)
        return (
          <section
            key={stage}
            className={`board-column ${over === stage ? 'is-over' : ''}`}
            style={{ '--stage': STAGE_COLORS[stage].dot, '--stage-bg': STAGE_COLORS[stage].bg }}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(stage)
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              setDragging(null)
              const id = e.dataTransfer.getData('text/plain')
              if (id) onMove(id, stage)
            }}
          >
            <header className="board-column-header">
              <span className="board-column-title">
                <i /> {stage}
              </span>
              <span className="board-count">{cards.length}</span>
              {total > 0 && <span className="board-total">{formatINR(total)}</span>}
            </header>

            <div className="board-cards">
              {cards.map((lead) => (
                <button
                  key={lead.id}
                  className={`board-card ${dragging === lead.id ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDragging(lead.id)
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onOpen(lead.id)}
                >
                  <span className="board-card-company">{lead.company}</span>
                  <span className="board-card-service">{lead.serviceDetail}</span>
                  <span className="board-card-foot">
                    <span>{lead.assignedTo}</span>
                    {lead.quoteValue ? <b>{formatINR(lead.quoteValue)}</b> : null}
                  </span>
                  {lead.nextFollowUp && (
                    <span className={`board-card-date ${lead.nextFollowUp < todayISO ? 'tone-urgent' : lead.nextFollowUp === todayISO ? 'tone-attention' : ''}`}>
                      Follow-up {lead.nextFollowUp === todayISO ? 'today' : formatDayMonth(lead.nextFollowUp)}
                    </span>
                  )}
                </button>
              ))}
              {cards.length === 0 && <p className="board-empty">Drop leads here</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
