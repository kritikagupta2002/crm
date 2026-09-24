import { useState } from 'react'
import { STAGE_COLORS } from '../../components/common/stageColors'
import { STAGES, TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { serviceSummary } from '../../utils/leads'
import { useMoney } from '../../context/crm'
import { queriesOf } from '../../data/queries'

const todayISO = toISODate(TODAY)

/*
 * Kanban board: drag a card to another column to change its stage.
 * (Native HTML drag and drop — on touch screens, stages are changed from the lead's detail panel.)
 * Without onMove (a role that can't change stages) the cards only open.
 */
export function LeadsBoard({ leads, onOpen, onMove }) {
  const money = useMoney()
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
              if (!onMove) return
              e.preventDefault()
              setOver(stage)
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              setDragging(null)
              const id = e.dataTransfer.getData('text/plain')
              if (id && onMove) onMove(id, stage)
            }}
          >
            <header className="board-column-header">
              <span className="board-column-title">
                <i /> {stage}
              </span>
              <span className="board-count">{cards.length}</span>
              {total > 0 && <span className="board-total">{money.short(total)}</span>}
            </header>

            <div className="board-cards">
              {cards.map((lead) => (
                <button
                  key={lead.id}
                  className={`board-card ${dragging === lead.id ? 'is-dragging' : ''}`}
                  draggable={Boolean(onMove)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDragging(lead.id)
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onOpen(lead.id)}
                >
                  <span className="board-card-company">{lead.company}</span>
                  <span className="board-card-service">{serviceSummary(lead)}</span>
                  <span className="board-card-foot">
                    <span>{lead.assignedTo}</span>
                    {lead.quoteValue ? <b>{money.short(lead.quoteValue)}</b> : null}
                  </span>
                  {queriesOf(lead).some((q) => q.status === 'Open') && <span className="board-card-date tone-attention">Client question waiting</span>}
                  {lead.nextFollowUp && (
                    <span className={`board-card-date ${lead.nextFollowUp < todayISO ? 'tone-urgent' : lead.nextFollowUp === todayISO ? 'tone-attention' : ''}`}>
                      Follow-up {lead.nextFollowUp === todayISO ? 'today' : formatDayMonth(lead.nextFollowUp)}
                    </span>
                  )}
                </button>
              ))}
              {cards.length === 0 && <p className="board-empty">{onMove ? 'Drop leads here' : 'No leads'}</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
