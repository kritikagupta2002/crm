import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
export const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50], className = '', }) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    return (<div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-2.5 sm:py-3 px-3 sm:px-4 border-t border-[#F0EDE8] dark:border-[#253344] text-xs text-[#8B7355] dark:text-slate-400 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-start w-full sm:w-auto">
        <div className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <span>Showing</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span>
          {startItem === endItem ? (<>
              <span>of</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span>
              <span>{totalItems === 1 ? 'result' : 'results'}</span>
            </>) : (<>
              <span>to</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span>
              <span>of</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span>
              <span>results</span>
            </>)}
        </div>
        {onPageSizeChange && (<div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <span className="text-slate-500 dark:text-slate-400">Rows:</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="border border-[#E8E4DC] dark:border-[#374B63] rounded-md px-2 py-1 bg-white dark:bg-[#111821] text-[#2D3748] dark:text-slate-200 text-xs focus:ring-1 focus:ring-[#D5860B] focus:outline-none cursor-pointer transition-all">
              {pageSizeOptions.map((opt) => (<option key={opt} value={opt}>
                  {opt}
                </option>))}
            </select>
          </div>)}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center w-full sm:w-auto">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(1)} aria-label="First page" className="p-1 sm:p-1.5">
          <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
        </Button>
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page" className="p-1 sm:p-1.5">
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
        </Button>

        <span className="px-1.5 sm:px-3 font-medium text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs whitespace-nowrap">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page" className="p-1 sm:p-1.5">
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
        </Button>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page" className="p-1 sm:p-1.5">
          <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
        </Button>
      </div>
    </div>);
};
