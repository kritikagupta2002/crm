import { ContourLines } from '../../components/common/ContourLines'
import { MountainRange } from '../../components/common/MountainRange'

/*
 * The band at the top of the client-facing pages (portal, enquiry form): the sidebar's light grey,
 * with faint contour lines and the mountain range along the right, fading into the band.
 * The page's cards start slightly over its lower edge.
 */
export function PortalBand({ compact = false, children }) {
  return (
    <section className={`portal-band ${compact ? 'is-compact' : ''}`}>
      <ContourLines className="band-contours" lines={16} />
      <MountainRange className="band-range" />
      <div className="portal-band-inner">{children}</div>
    </section>
  )
}
