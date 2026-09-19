import { STAGE_COLORS } from './stageColors'

export function StagePill({ stage }) {
  const { bg, fg } = STAGE_COLORS[stage]
  return (
    <span className="pill" style={{ background: bg, color: fg }}>
      {stage}
    </span>
  )
}
