import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  pagination,
  onPageChange,
  emptyMessage = 'No records found matching your filter.',
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Search Bar & Table Controls */}
      {onSearchChange && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
            />
          </div>
          {pagination && (
            <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
              Showing <span className="text-slate-900 font-bold">{data.length}</span> of{' '}
              <span className="text-slate-900 font-bold">{pagination.total || data.length}</span> records
            </div>
          )}
        </div>
      )}

      {/* ── Desktop & Tablet View (Standard High-Precision Table) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 font-extrabold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <LoadingSpinner text="Fetching verified records..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-amber-50/30 transition-colors duration-150"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4.5 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Adaptive Card List (No awkward horizontal scroll on phone) ── */}
      <div className="md:hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 text-center">
            <LoadingSpinner text="Fetching verified records..." />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2 px-4">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-medium text-xs text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          data.map((row, rowIdx) => (
            <div key={row.id || rowIdx} className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {col.header}
                  </span>
                  <div className="text-right font-medium text-slate-800">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
