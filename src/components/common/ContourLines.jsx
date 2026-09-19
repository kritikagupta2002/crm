/*
 * Topographic contour lines — the brand's decorative motif (a nod to survey maps).
 * Every fourth line is drawn in the accent colour, like index contours on a survey map.
 */
export function ContourLines({ className, lines = 14, color = 'var(--teal-200)', accent = 'var(--gold-200)' }) {
  return (
    <svg className={className} viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => {
        const y = 20 + i * 16
        const wobble = 18 + (i % 5) * 4
        const d = `M-20 ${y} C 90 ${y - wobble}, 170 ${y + wobble}, 290 ${y - 6} S 470 ${y - wobble - 8}, 620 ${y + 4}`
        return <path key={i} d={d} fill="none" stroke={i % 4 === 0 ? accent : color} strokeWidth={i % 4 === 0 ? 1.4 : 1} />
      })}
      <ellipse cx="455" cy="92" rx="54" ry="26" fill="none" stroke={color} />
      <ellipse cx="455" cy="92" rx="32" ry="14" fill="none" stroke={accent} strokeWidth="1.4" />
      <ellipse cx="455" cy="92" rx="12" ry="5" fill="none" stroke={color} />
    </svg>
  )
}
