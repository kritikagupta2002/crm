import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

/* First, last and the pages around the current one; gaps become "…". */
export function pageList(current, count) {
  const pages = []
  for (let p = 0; p < count; p++) {
    if (p === 0 || p === count - 1 || Math.abs(p - current) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return pages
}

/*
 * Client-side paging for a list: returns the rows of the current page and the pager bar.
 * resetKey (e.g. the active tab and search) sends it back to page 1 when the filters change.
 */
export function usePaged(items, pageSize = 10, resetKey = '') {
  const [state, setState] = useState({ page: 0, key: resetKey })
  if (state.key !== resetKey) setState({ page: 0, key: resetKey })
  const page = state.key === resetKey ? state.page : 0
  const setPage = (next) => setState({ page: next, key: resetKey })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const rows = items.slice(current * pageSize, (current + 1) * pageSize)

  const pager =
    items.length > pageSize ? (
      <div className="pager">
        <span className="muted">
          Showing {current * pageSize + 1}–{Math.min((current + 1) * pageSize, items.length)} of {items.length}
        </span>
        <nav className="pager-buttons" aria-label="Pages">
          <button className="page-button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {pageList(current, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="page-gap">
                …
              </span>
            ) : (
              <button key={p} className={`page-button ${p === current ? 'is-current' : ''}`} onClick={() => setPage(p)} aria-current={p === current ? 'page' : undefined}>
                {p + 1}
              </button>
            ),
          )}
          <button className="page-button" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    ) : null

  return { rows, pager }
}
