import { useState, useMemo } from 'react'
import {
  Eye,
  Pencil,
  Download,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react'
import { ServiceTablePagination } from './ServiceTablePagination'
import { DataOriginIcon, isExcelOrigin } from './DataOriginIcon'

export function ServiceLogTable({
  logs = [],
  isLoading = false,
  errorMsg = '',
  onViewDetail,
  onEditLog,
  onDownloadFile,
  onDeleteLog,
  onRetry,
  hasCategoryColumn = false,
  searchTerm = '',
  hasActiveFilter = false,
  onResetFilter,
  pagination = null,
  isExcel = undefined,
  borderless = false,
}) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedLogs = useMemo(() => {
    if (!Array.isArray(logs) || logs.length <= 1) return logs
    const copy = [...logs]
    copy.sort((a, b) => {
      const valA = String(a?.[sortField] ?? '').toLowerCase()
      const valB = String(b?.[sortField] ?? '').toLowerCase()
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [logs, sortField, sortDir])

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#175CD3] dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#175CD3] dark:text-blue-400" />
    )
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const timePart = d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(':', '.')
      return `${datePart}, ${timePart} WIB`
    } catch {
      return dateStr
    }
  }

  const formatFileSize = (bytes) => {
    const num = Number(bytes)
    if (!num || !Number.isFinite(num)) return ''
    const kb = num / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const colCount = hasCategoryColumn ? 6 : 5

  return (
    <div
      className={
        borderless
          ? 'rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden'
          : 'rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden'
      }
    >
      {/* 1. Standardized Error State Banner inside container header */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-100/60 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto clean-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('file_name')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase font-bold"
                >
                  <span>FILE UNGGAH</span>
                  {renderSortIcon('file_name')}
                </button>
              </th>
              <th className="py-3.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort('period')}
                  className="inline-flex items-center justify-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase font-bold mx-auto"
                >
                  <span>PERIODE</span>
                  {renderSortIcon('period')}
                </button>
              </th>
              {hasCategoryColumn && (
                <th className="py-3.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort('doc_category')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase font-bold mx-auto"
                  >
                    <span>KATEGORI</span>
                    {renderSortIcon('doc_category')}
                  </button>
                </th>
              )}
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('created_at')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase font-bold"
                >
                  <span>TANGGAL UPLOAD</span>
                  {renderSortIcon('created_at')}
                </button>
              </th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('created_by')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase font-bold"
                >
                  <span>PENGUPLOAD</span>
                  {renderSortIcon('created_by')}
                </button>
              </th>
              <th className="py-3.5 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-2.5 w-28 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto"></div>
                  </td>
                  {hasCategoryColumn && (
                    <td className="py-4 px-3">
                      <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto"></div>
                    </td>
                  )}
                  <td className="py-4 px-3">
                    <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto px-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      {searchTerm || hasActiveFilter ? (
                        <Search className="w-5 h-5 text-slate-400" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      {searchTerm
                        ? `Tidak ada data yang cocok dengan "${searchTerm}"`
                        : hasActiveFilter
                        ? 'Belum ada data usul pada filter periode/kategori ini'
                        : 'Belum ada data rekapan usul pada layanan ini'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      {searchTerm || hasActiveFilter
                        ? 'Coba ubah kata kunci pencarian atau atur ulang filter bulan dan kategori di atas.'
                        : 'Gunakan tombol Input Data atau Upload Data Batch di bagian kanan atas untuk mulai menambahkan data.'}
                    </p>
                    {(searchTerm || hasActiveFilter) && onResetFilter && (
                      <button
                        type="button"
                        onClick={onResetFilter}
                        className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#175CD3] dark:text-blue-400" />
                        <span>Reset Filter & Pencarian</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedLogs.map((row) => {
                const rowIsExcel = isExcel !== undefined ? isExcel : isExcelOrigin(row)
                const canDownload = Boolean(row.file_url && rowIsExcel)
                const totalInstansi = Number(row.total_instansi || 0)
                const totalUsul = Number(row.total_usul || 0)
                const metaParts = []
                if (row.file_size) metaParts.push(formatFileSize(row.file_size))
                if (totalInstansi > 0 || totalUsul > 0) {
                  metaParts.push(`${totalInstansi} Instansi (${totalUsul.toLocaleString('id-ID')} Usul)`)
                }
                if (row.remarks) metaParts.push(row.remarks)

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* 1. FILE UNGGAH */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <DataOriginIcon isExcel={rowIsExcel} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewDetail && onViewDetail(row)}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-md cursor-pointer"
                            title={`Lihat rincian ${row.file_name}`}
                          >
                            {row.file_name}
                          </button>
                          {metaParts.length > 0 && (
                            <div
                              className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md"
                              title={metaParts.join(' • ')}
                            >
                              {metaParts.join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. PERIODE */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{row.period || '-'}</span>
                      </span>
                    </td>

                    {/* 3. KATEGORI (bila layanan memiliki sub-kategori/event) */}
                    {hasCategoryColumn && (
                      <td className="py-3.5 px-3 whitespace-nowrap text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50/70 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 max-w-[220px] truncate"
                          title={row.doc_category || '-'}
                        >
                          {row.doc_category || '-'}
                        </span>
                      </td>
                    )}

                    {/* 4. TANGGAL UPLOAD */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(row.created_at)}</span>
                      </div>
                    </td>

                    {/* 5. PENGUPLOAD */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{row.created_by || '-'}</span>
                      </div>
                    </td>

                    {/* 6. AKSI */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewDetail && (
                          <button
                            type="button"
                            onClick={() => onViewDetail(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Lihat Rincian Usul Instansi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {onEditLog && (
                          <button
                            type="button"
                            onClick={() => onEditLog(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ubah Data Usul"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        {onDownloadFile && canDownload && (
                          <button
                            type="button"
                            onClick={() => onDownloadFile(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Unduh Berkas Excel"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {onDeleteLog && (
                          <button
                            type="button"
                            onClick={() => onDeleteLog(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Card Footer: Info, Show page size, & Pagination */}
      {pagination && (
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        </div>
      )}
    </div>
  )
}
