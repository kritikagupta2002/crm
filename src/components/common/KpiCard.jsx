import { Link } from 'react-router-dom'
import { AnimatedNumber } from './AnimatedNumber'

/* Stat card used across pages: tone colours the icon and top edge, the number counts up. With `to`, the card is a link. */
export function KpiCard({ tone, icon: Icon, label, value, format, children, to }) {
  const Tag = to ? Link : 'article'
  return (
    <Tag to={to} className={`card stat-card ${tone} ${to ? 'is-link' : ''}`}>
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <h3>{label}</h3>
      </div>
      <strong className="stat-value">{typeof value === 'number' ? <AnimatedNumber value={value} format={format} /> : value}</strong>
      {children && <div className="stat-meta">{children}</div>}
    </Tag>
  )
}
