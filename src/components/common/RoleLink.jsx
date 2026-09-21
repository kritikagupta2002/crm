import { Link } from 'react-router-dom'
import { useAccess } from '../../context/crm'

/*
 * A link that respects the signed-in role: a normal link when the role can open the page, otherwise
 * plain text (or nothing, with hideIfLocked — for action buttons such as "View quotation").
 */
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
