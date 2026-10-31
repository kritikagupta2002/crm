import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* CRM-style page list helper with ellipsis */
function pageList(current, count) {
  const pages = [];
  for (let p = 0; p < count; p++) {
    if (p === 0 || p === count - 1 || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return pages;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`pager ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="muted text-xs">
          Showing {startItem}–{endItem} of {totalItems} {totalItems === 1 ? 'record' : 'records'}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="select select-sm"
              style={{ height: '30px', padding: '0 24px 0 8px', fontSize: '12px' }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="pager-buttons" aria-label="Pages">
          <button
            type="button"
            className="page-button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {pageList(currentPage - 1, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="page-gap">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`page-button ${p + 1 === currentPage ? 'is-current' : ''}`}
                onClick={() => onPageChange(p + 1)}
                aria-current={p + 1 === currentPage ? 'page' : undefined}
              >
                {p + 1}
              </button>
            )
          )}
          <button
            type="button"
            className="page-button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
};
