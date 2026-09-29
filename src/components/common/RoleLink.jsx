import { Link } from 'react-router-dom'
import { useAccess } from '../../context/crm'

export function RoleLink({ to, hideIfLocked = false, className, children, ...rest }) {
  const { can } = useAccess()
  if (can(to))
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    )
  return hideIfLocked ? null : <span className={className}>{children}</span>
}
