export function Logo({ compact = false }) {
  return (
    <div className="logo">
      <svg className="logo-mark" viewBox="0 0 48 40" aria-hidden="true">
        <path d="M2 38 L20 4 L29 20 L33 14 L46 38 Z" fill="var(--gold-500)" />
        <path d="M12 38 L20 24 L28 38 Z" fill="var(--ink)" />
        <path d="M20 4 L24 11.5 L20 10 L16.5 11 Z" fill="#fff" opacity="0.85" />
      </svg>
      {!compact && (
        <div className="logo-text">
          <span className="logo-name">Bansal Geo</span>
          <span className="logo-sub">Solutions Pvt. Ltd.</span>
          <span className="logo-tag">Exploring Sustainable Tomorrow</span>
        </div>
      )}
    </div>
  )
}
