/* Horizontal bars for report cards: a label, a count with a note, and a bar scaled to the largest row. */
export function Bars({ rows, color }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="insight-bars report-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="insight-bar-top">
            <span>{row.label}</span>
            <span>
              <b>{row.count}</b> {row.note && <span className="muted">{row.note}</span>}
            </span>
          </div>
          <div className="insight-track">
            <div style={{ width: `${(row.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
