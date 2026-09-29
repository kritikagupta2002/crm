import { ContourLines } from '../../components/common/ContourLines'
import { MountainRange } from '../../components/common/MountainRange'

export function PortalBand({ compact = false, children }) {
  return (
    <section className={`portal-band ${compact ? 'is-compact' : ''}`}>
      <ContourLines className="band-contours" lines={16} />
      <MountainRange className="band-range" />
      <div className="portal-band-inner">{children}</div>
    </section>
  )
}
