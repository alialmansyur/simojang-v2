import { Children } from 'react'
import { AppSpinner } from '../shared/AppSpinner'

export function DataTable({
  headers,
  children,
  pagination,
  paginationMeta,
  onPageChange,
  emptyState,
  minWidth = 'min-w-[960px]',
  isLoading = false,
}) {
  const isPaginationObject = Boolean(pagination && typeof pagination === 'object')
  const meta = paginationMeta || (isPaginationObject ? pagination : null)
  const hasRows = Children.count(children) > 0

  return (
    <div className="app-panel-shell overflow-hidden relative border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center backdrop-blur-sm">
          <AppSpinner size="lg" strokeWidth={4} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className={`w-full text-left border-collapse ${minWidth}`}>
          <thead>
            <tr className="bg-[#F7F9FC] dark:bg-slate-900/50 border-b border-[#EAECF0] dark:border-slate-800">
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
            {hasRows ? children : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400"
                >
                  {emptyState || 'Belum ada data untuk ditampilkan.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta ? (
        <div className="bg-[#F7F9FC] dark:bg-slate-900/30 px-6 py-4 border-t border-[#EAECF0] dark:border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Menampilkan <span className="font-bold text-[#123B73] dark:text-white">{meta.from}</span> - <span className="font-bold text-[#123B73] dark:text-white">{meta.to}</span> dari <span className="font-bold text-[#123B73] dark:text-white">{meta.total}</span> data
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => onPageChange && onPageChange(meta.page - 1)}
              className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Prev
            </button>
            {(() => {
              const pages = []
              const total = meta.totalPages
              const current = meta.page
              
              if (total <= 1) return null
              
              pages.push(1)
              
              if (current > 3) pages.push('...')
              
              for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                pages.push(i)
              }
              
              if (current < total - 2) pages.push('...')
              
              pages.push(total)
              
              return pages.map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return <span key={`gap-${index}`} className="px-1.5 font-bold text-slate-400">...</span>
                }
                
                return (
                  <span key={pageNumber} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPageChange && onPageChange(pageNumber)}
                      className={`px-3.5 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer font-bold text-xs sm:text-sm ${
                        pageNumber === current
                          ? 'bg-[#175CD3] border-[#175CD3] text-white shadow-xs'
                          : 'border-[#EAECF0] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </span>
                )
              })
            })()}
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange && onPageChange(meta.page + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        </div>
      ) : pagination ? (
        <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-[#EAECF0] dark:border-slate-800 flex items-center justify-between text-sm">
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">1</span> - <span className="font-bold text-slate-900 dark:text-white">10</span> dari <span className="font-bold text-slate-900 dark:text-white">97</span> data
          </div>
          <div className="flex gap-1 items-center">
            <button className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs sm:text-sm">Prev</button>
            <button className="px-3.5 py-1.5 rounded-xl bg-[#175CD3] text-white font-bold shadow-xs cursor-pointer text-xs sm:text-sm">1</button>
            <button className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs sm:text-sm">2</button>
            <button className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs sm:text-sm">3</button>
            <button className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs sm:text-sm">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
