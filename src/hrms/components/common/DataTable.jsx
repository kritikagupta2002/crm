import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, X } from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
export function DataTable({ columns, data, keyField, searchable = true, searchPlaceholder = 'Search records...', searchFields, filterComponent, actionsComponent, selectable = false, onSelectionChange, pageSize: initialPageSize = 10, emptyTitle, emptyDescription, className = '', onRowClick, goldTopBorder = false, compact = false, }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedIds, setSelectedIds] = useState(new Set());
    // Reset to first page whenever the dataset changes from the parent
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);
    const getKey = (item) => {
        if (typeof keyField === 'function') {
            return keyField(item);
        }
        return String(item[keyField]);
    };
    // Optimized search filtering with fast-path string checks
    const filteredData = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term)
            return data;
        return data.filter((item) => {
            if (searchFields && searchFields.length > 0) {
                return searchFields.some((field) => {
                    const val = item[field];
                    return val != null && String(val).toLowerCase().includes(term);
                });
            }
            // Default fast-path: search string/number values
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    const val = item[key];
                    if (typeof val === 'string' && val.toLowerCase().includes(term)) {
                        return true;
                    }
                    if (typeof val === 'number' && String(val).includes(term)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }, [data, searchTerm, searchFields]);
    // Sorting
    const sortedData = useMemo(() => {
        if (!sortKey)
            return filteredData;
        return [...filteredData].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA == null)
                return 1;
            if (valB == null)
                return -1;
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === 'asc' ? valA - valB : valB - valA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
    }, [filteredData, sortKey, sortDirection]);
    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);
    const handleSort = (key) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            }
            else {
                setSortKey(null);
            }
        }
        else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    const handleSelectAll = (checked) => {
        const newSet = new Set();
        if (checked) {
            paginatedData.forEach((item) => newSet.add(getKey(item)));
        }
        setSelectedIds(newSet);
        if (onSelectionChange) {
            onSelectionChange(checked ? paginatedData : []);
        }
    };
    const handleSelectItem = (item, checked) => {
        const key = getKey(item);
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(key);
        }
        else {
            newSet.delete(key);
        }
        setSelectedIds(newSet);
        if (onSelectionChange) {
            const selected = data.filter((d) => newSet.has(getKey(d)));
            onSelectionChange(selected);
        }
    };
    const isAllSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(getKey(item)));
    return (<div className={`bg-white dark:bg-[#161F2E] rounded-[14px] border border-[#E2E8F0] dark:border-[#253344] shadow-xs overflow-hidden flex flex-col relative
        ${goldTopBorder ? 'border-t-2 border-t-[#F59E0B]' : ''}
        ${className}`}>
      {/* Table Toolbar */}
      {(searchable || filterComponent || actionsComponent) && (<div className={`${compact ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3.5'} border-b border-[#E2E8F0] dark:border-[#253344] flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 bg-white dark:bg-[#161F2E]`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0 w-full xl:w-auto flex-wrap">
            {searchable && (<div className="relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0">
                <Search
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#627079] pointer-events-none"
                  style={{ left: '13px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  style={{ paddingLeft: '36px', paddingRight: '30px' }}
                  className={`w-full text-sm font-sans border border-[#d3dce1] rounded-lg focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 placeholder:text-[#7c8b96] text-[#0f2a3d] bg-[#ffffff] transition-all duration-200 ${compact ? 'h-[36px] py-1.5' : 'h-[40px] py-2'} shadow-2xs`}
                />
                {searchTerm && (<button type="button" onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                    }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7c8b96] hover:text-[#0f2a3d] p-0.5 rounded-md transition-colors" title="Clear search">
                    <X className="w-3.5 h-3.5"/>
                  </button>)}
              </div>)}
            {sortedData.length > 0 && (<span className={`hidden sm:inline-flex items-center text-xs font-sans font-medium text-[#4a5b68] bg-[#f4f7f8] px-3 rounded-full border border-[#d3dce1] shadow-2xs ${compact ? 'h-[36px]' : 'h-[40px]'}`}>
                {sortedData.length} {sortedData.length === 1 ? 'record' : 'records'}
              </span>)}
            {filterComponent && (<div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {filterComponent}
              </div>)}
          </div>

          {actionsComponent && (<div className="flex items-center gap-2 shrink-0 w-full xl:w-auto justify-end sm:justify-start xl:ml-auto">
              {actionsComponent}
            </div>)}
        </div>)}

      {/* Table Container with Smooth Touch Horizontal Scrolling */}
      <div className="overflow-x-auto custom-sidebar-scroll w-full touch-pan-x">
        <table className="w-full text-left border-collapse text-sm min-w-[720px] lg:min-w-full">
          <thead>
            <tr className="bg-[#f4f7f8] border-b border-[#e1e8eb] text-[#0f2a3d] font-sans font-semibold text-xs tracking-normal">
              {selectable && (<th className={`${compact ? 'py-2.5 px-3' : 'py-3 px-3.5'} w-10`}>
                  <input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-[#d3dce1] text-teal-700 focus:ring-teal-600 cursor-pointer w-3.5 h-3.5"/>
                </th>)}
              {columns.map((col) => {
            const isCenter = col.className?.includes('text-center');
            const isRight = col.className?.includes('text-right');
            const isStickyRight = col.className?.includes('sticky');
            const justifyClass = isCenter ? 'justify-center' : isRight ? 'justify-end' : 'justify-start';
            return (<th key={col.key} className={`${compact ? 'py-2.5 px-3 sm:px-3.5' : 'py-3.5 px-3.5 sm:px-4'} select-none whitespace-nowrap font-sans ${col.className || ''} ${isStickyRight
                    ? 'sticky right-0 z-20 bg-[#f4f7f8] shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.04)]'
                    : ''} ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`} onClick={() => col.sortable && handleSort(col.key)}>
                    <div className={`flex items-center gap-1.5 ${justifyClass}`}>
                      <span>{col.header}</span>
                      {col.sortable && (<span className="text-slate-400">
                          {sortKey === col.key ? (sortDirection === 'asc' ? (<ChevronUp className="w-3.5 h-3.5 text-teal-700"/>) : (<ChevronDown className="w-3.5 h-3.5 text-teal-700"/>)) : (<ChevronsUpDown className="w-3.5 h-3.5 hover:text-teal-700"/>)}
                        </span>)}
                    </div>
                  </th>);
        })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1f3] font-sans">
            {paginatedData.length === 0 ? (<tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} className="border-none shadow-none bg-transparent"/>
                </td>
              </tr>) : (paginatedData.map((item, index) => {
            const key = getKey(item) || String(index);
            const isSelected = selectedIds.has(key);
            return (<tr key={key} onClick={() => onRowClick && onRowClick(item)} className={`group transition-colors duration-150 ${isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50/80'} ${onRowClick ? 'cursor-pointer' : ''}`}>
                    {selectable && (<td className={`${compact ? 'py-2.5 px-3 sm:px-3.5' : 'py-3 px-3 sm:px-4'} w-10 align-middle`} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => handleSelectItem(item, e.target.checked)} className="rounded border-[#d3dce1] text-teal-700 focus:ring-teal-600 cursor-pointer w-3.5 h-3.5"/>
                      </td>)}
                    {columns.map((col) => {
                    const isStickyRight = col.className?.includes('sticky');
                    return (<td key={col.key} className={`${compact ? 'py-2.5 px-3 sm:px-3.5' : 'py-3 px-3 sm:px-4'} align-middle text-[#4a5b68] ${col.className || ''} ${isStickyRight
                            ? `sticky right-0 z-10 ${isSelected
                                ? 'bg-teal-50'
                                : 'bg-white group-hover:bg-slate-50'} shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.04)]`
                            : ''}`}>
                          {col.render ? col.render(item) : item[col.key]}
                        </td>);
                })}
                    </tr>);
        }))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      {sortedData.length > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedData.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
            }}/>)}
    </div>);
}
