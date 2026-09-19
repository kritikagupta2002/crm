import { CheckCircle2, XCircle } from 'lucide-react'
import { useCrm } from '../../context/crm'
import { STAGES } from '../../data/mockData'

const OPEN_STAGES = STAGES.filter((stage) => stage !== 'Won' && stage !== 'Lost')

/* Move a lead between open stages, or close it as Won / Lost (Lost asks for a reason via onMarkLost). */
export function LeadStageActions({ lead, onMarkLost }) {
  const { changeStage } = useCrm()
  const isClosed = lead.stage === 'Won' || lead.stage === 'Lost'

  return (
    <div className="stage-actions">
      <label className="field stage-select">
        <span className="sr-only">Move to stage</span>
        <select value={isClosed ? '' : lead.stage} onChange={(e) => changeStage(lead.id, e.target.value)}>
          {isClosed && (
            <option value="" disabled>
              Reopen at…
            </option>
          )}
          {OPEN_STAGES.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </select>
      </label>
      {lead.stage !== 'Won' && (
        <button className="btn btn-success" onClick={() => changeStage(lead.id, 'Won')}>
          <CheckCircle2 size={16} /> Mark as Won
        </button>
      )}
      {lead.stage !== 'Lost' && (
        <button className="btn btn-outline-danger" onClick={() => onMarkLost(lead.id)}>
          <XCircle size={16} /> Mark as Lost
        </button>
      )}
    </div>
  )
}
