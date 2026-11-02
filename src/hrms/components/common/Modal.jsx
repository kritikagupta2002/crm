import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/*
 * Body scroll is locked while any modal is open. A counter keeps nested or stacked modals from unlocking the
 * page when only one of them closes (the old behaviour left the page stuck or scrolling behind the dialog).
 */
let openCount = 0;
function lockScroll() {
    if (openCount === 0) {
        const gap = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    }
    openCount += 1;
}
function unlockScroll() {
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
}

export const Modal = ({ isOpen, onClose, title, description, children, footer, maxWidth = 'lg' }) => {
    const titleId = useId();
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return undefined;
        lockScroll();
        const previouslyFocused = document.activeElement;
        const onKey = (e) => {
            if (e.key === 'Escape') onCloseRef.current?.();
        };
        window.addEventListener('keydown', onKey);
        // Move focus into the dialog for keyboard and screen-reader users.
        requestAnimationFrame(() => panelRef.current?.focus());
        return () => {
            window.removeEventListener('keydown', onKey);
            unlockScroll();
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Rendered inside .hrms so the HRMS theme applies, but outside page containers that clip or transform.
    const host = document.querySelector('.hrms') || document.body;
    return createPortal(<div className="modal-root" role="presentation">
      <div className="modal-backdrop" onClick={onClose}/>
      <div ref={panelRef} className={`modal-panel w-${maxWidth}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-head">
          <div id={titleId} className="min-w-0 flex-1">
            {typeof title === 'string' ? <h3>{title}</h3> : title}
            {description && <p>{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
            <X size={18}/>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>, host);
};
