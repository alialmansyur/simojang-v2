import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react'
import { ServiceKpiGrid } from '../ServiceKpiGrid'
import { WasdalBatchUploadModal } from './WasdalBatchUploadModal'
import { WasdalDeleteConfirmDialog } from './WasdalDeleteConfirmDialog'
import { WasdalDetailDialog } from './WasdalDetailDialog'
import { ServiceTablePagination } from '../ServiceTablePagination'
import { ServiceFilterToolbar } from '../ServiceFilterToolbar'

export function WasdalCrudLayoutShell({
  serviceTitle = 'Layanan Pengawasan & Pengendalian',
  shortTitle,
  description = 'Pengawasan, evaluasi, dan pengendalian manajemen ASN wilayah kerja Kanreg III BKN Bandung.',
  timKerjaTitle = 'Pengawasan & Pengendalian',
  templateUrl = '/templates/wasdal/template-sistem-merit.xlsx',
  templateName = 'template-sistem-merit.xlsx',
  fetchSummaryFn,
  fetchDataFn,
  deleteDataFn,
  batchUploadFn,
  renderKpis,
  columns = [],
  renderRow,
  FormComponent,
  categories = [],
  defaultCategory = '',
  searchPlaceholder = 'Cari nama instansi, periode, atau auditor...',
  detailType = 'merit',
}) {
  // State: Data
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedMonths, setSelectedMonths] = useState([])
  const [activeCategory, setActiveCategory] = useState(defaultCategory)

  // State: Modals & Actions
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailItem, setDetailItem] = useState(null)

  // State: Loading & Error
  const [isLoading, setIsLoading] = useState(true)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const abortControllerRef = useRef(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    if (!fetchSummaryFn) return
    try {
      setIsSummaryLoading(true)
      const data = await fetchSummaryFn({ bulan: selectedMonths })
      setSummary(data)
    } catch (err) {
      console.warn('Failed to load summary KPI:', err)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [fetchSummaryFn, selectedMonths])

  // Load Table Data
  const loadData = useCallback(
    async (isManual = false) => {
      if (!fetchDataFn) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        if (isManual) setIsReloading(true)
        else setIsLoading(true)
        setErrorMsg('')

        const start = (page - 1) * pageSize
        const effectiveCategory =
          activeCategory && activeCategory !== 'all' ? activeCategory : ''

        const result = await fetchDataFn({
          bulan: selectedMonths,
          start,
          length: pageSize,
          search: debouncedSearch,
          category: effectiveCategory,
          kategori: effectiveCategory,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        const dataRows = Array.isArray(result?.data) ? result.data : []
        const totalCount =
          result?.filtered !== undefined && result?.filtered !== null
            ? Number(result.filtered)
            : Number(result?.total ?? dataRows.length)

        setItems(dataRows)
        setTotalRecords(totalCount)
      } catch (err) {
        if (err.name === 'AbortError') return
        setErrorMsg(err.message || 'Gagal memuat data dari server.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsReloading(false)
        }
      }
    },
    [fetchDataFn, selectedMonths, activeCategory, page, pageSize, debouncedSearch]
  )

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) loadSummary()
    })
    return () => {
      active = false
    }
  }, [loadSummary])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) loadData()
    })
    return () => {
      active = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadData])

  const handleManualReload = () => {
    loadSummary()
    loadData(true)
  }

  const handleMonthChange = (months) => {
    setSelectedMonths(months)
    setPage(1)
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
      selectedMonths.length > 0 ||
      (activeCategory && activeCategory !== 'all' && activeCategory !== defaultCategory)
  )

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setSelectedMonths([])
    setActiveCategory(defaultCategory || '')
    setPage(1)
  }

  // Accurate Category Counts from Summary API
  const categoryCounts = useMemo(() => {
    const counts = {}
    if (!categories || categories.length === 0) return counts

    categories.forEach((cat) => {
      const val = String(cat.value || '')
      const valLower = val.toLowerCase()

      if (valLower === 'all') {
        if (summary?.total_data !== undefined) {
          counts[val] = Number(summary.total_data)
          return
        }
      }

      // NSPK Levels: level_a, level_b, level_c, level_d
      const levelKey = `level_${valLower}`
      if (summary && summary[levelKey] !== undefined) {
        counts[val] = Number(summary[levelKey])
        return
      }

      // Sistem Merit SLA: sesuai_count, tidak_sesuai_count
      if (valLower === 'sesuai' && summary?.sesuai_count !== undefined) {
        counts[val] = Number(summary.sesuai_count)
        return
      }
      if (valLower === 'tidak_sesuai' && summary?.tidak_sesuai_count !== undefined) {
        counts[val] = Number(summary.tidak_sesuai_count)
        return
      }

      // Wasdal Netralitas: netralitas_count, disiplin_count, kode_etik_count, lainnya_count
      if (
        (valLower === 'netralitas' || valLower === 'netralitas asn') &&
        summary?.netralitas_count !== undefined
      ) {
        counts[val] = Number(summary.netralitas_count)
        return
      }
      if (
        (valLower === 'disiplin' || valLower === 'disiplin pegawai') &&
        summary?.disiplin_count !== undefined
      ) {
        counts[val] = Number(summary.disiplin_count)
        return
      }
      if (valLower === 'kode etik' && summary?.kode_etik_count !== undefined) {
        counts[val] = Number(summary.kode_etik_count)
        return
      }
      if (valLower === 'lainnya' && summary?.lainnya_count !== undefined) {
        counts[val] = Number(summary.lainnya_count)
        return
      }

      // Fallback from loaded items
      counts[val] = (items || []).filter((item) => {
        if (item.level) return String(item.level).toUpperCase() === val.toUpperCase()
        if (item.permasalahan)
          return String(item.permasalahan).toLowerCase().includes(valLower)
        if (valLower === 'sesuai') return Number(item.persentase_sla ?? 0) >= 80
        if (valLower === 'tidak_sesuai') return Number(item.persentase_sla ?? 0) < 80
        return false
      }).length
    })
    return counts
  }, [items, categories, summary])

  const displayItems = items

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !deleteDataFn) return
    try {
      setIsDeleting(true)
      await deleteDataFn(deletingItem.id || deletingItem.uid)
      setDeletingItem(null)
      toast.success('Data berhasil dihapus.')
      loadData()
      loadSummary()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  const kpis = renderKpis ? renderKpis(summary, isSummaryLoading) : undefined

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Actions (Standar SSOT SIMOJANG) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          {timKerjaTitle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{timKerjaTitle}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {serviceTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleManualReload}
            disabled={isReloading || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
            title="Muat ulang data"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${
                isReloading ? 'animate-spin text-[#175CD3]' : ''
              }`}
            />
            <span>Muat Ulang</span>
          </button>

          {FormComponent ? (
            <>
              <button
                type="button"
                onClick={() => setIsBatchUploadOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Upload Data (Batch Excel)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Data</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="Input Data"
              >
                <Plus className="w-4 h-4 stroke-[2.5] text-white" />
                <span>Input Data</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsBatchUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Upload Data"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Upload Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Compact Bento KPI Cards */}
      <ServiceKpiGrid
        summary={summary}
        isLoading={isSummaryLoading}
        kpis={kpis}
        borderless
      />

      {/* 3. Filter Toolbar */}
      <ServiceFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedMonths={selectedMonths}
        onMonthChange={handleMonthChange}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        totalRecords={totalRecords}
        totalAllRecords={summary?.total_data ?? totalRecords}
        categoryCounts={categoryCounts}
        placeholder={searchPlaceholder}
        borderless
      />

      {/* 4. Data Table (font-weight: 500 across all table text) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs overflow-hidden">
        {/* Standardized Error State */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-3 font-medium">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleManualReload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse font-semibold">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-3.5 px-4 sm:px-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] ${
                      col.className || ''
                    }`}
                    style={col.width ? { width: col.width } : {}}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200 font-semibold">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="py-4 px-4 sm:px-5 font-semibold">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 px-4 text-center text-slate-500 font-semibold"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {hasActiveFilters
                          ? 'Tidak ada data yang cocok dengan filter atau pencarian aktif'
                          : 'Belum ada data tercatat pada periode ini'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {hasActiveFilters
                          ? 'Coba sesuaikan kata kunci pencarian, pilihan bulan, atau kategori filter.'
                          : 'Klik tombol Input Data atau Upload Data di bagian kanan atas untuk menambahkan data.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-[#175CD3] dark:text-blue-400 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Filter & Pencarian</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayItems.map((item, idx) =>
                  renderRow(
                    item,
                    (page - 1) * pageSize + idx + 1,
                    handleOpenEdit,
                    setDeletingItem,
                    setDetailItem
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={totalRecords || displayItems.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* 5. Modals (Portaled to document.body with z-[100]/[110]) */}
      {FormComponent && isFormOpen && (
        <FormComponent
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            toast.success(
              editingItem ? 'Data berhasil diperbarui.' : 'Data baru berhasil disimpan.'
            )
            loadData()
            loadSummary()
          }}
          initialData={editingItem}
        />
      )}

      {isBatchUploadOpen && (
        <WasdalBatchUploadModal
          isOpen={isBatchUploadOpen}
          onClose={() => setIsBatchUploadOpen(false)}
          onUploadSuccess={() => {
            toast.success('Import batch data berhasil diproses.')
            loadData()
            loadSummary()
          }}
          serviceTitle={serviceTitle}
          templateUrl={templateUrl}
          templateName={templateName}
          uploadApiFn={batchUploadFn}
        />
      )}

      {deletingItem && (
        <WasdalDeleteConfirmDialog
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          title={`Hapus Data ${shortTitle || serviceTitle}`}
          message="Apakah Anda yakin ingin menghapus data pengawasan ini? Tindakan ini akan menghapus entri dari database dan mempengaruhi rekapitulasi capaian."
        />
      )}

      <WasdalDetailDialog
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        type={detailType}
      />
    </div>
  )
}
