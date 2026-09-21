import { createPortal } from 'react-dom'

/*
 * Renders overlays (drawers, dialogs, floating menus) straight into <body>.
 * Without this they sit inside the page, whose entrance animation makes it the containing
 * block for position: fixed children — the overlay would then be sized to the page, not the screen.
 */
export function Portal({ children }) {
  return createPortal(children, document.body)
}
