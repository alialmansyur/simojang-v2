import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Plus,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Search,
} from 'lucide-react'
import { ServiceKpiGrid } from '../ServiceKpiGrid'
import { TuBatchUploadModal } from './TuBatchUploadModal'
import { TuDeleteConfirmDialog } from './TuDeleteConfirmDialog'
import { ServiceTablePagination } from '../ServiceTablePagination'
import { ServiceFilterToolbar } from '../ServiceFilterToolbar'

export function TuCrudLayoutShell({
  layananId,
  serviceTitle = 'Layanan Tata Usaha',
  shortTitle,
  description = 'Pengelolaan administrasi kepegawaian, keuangan, dan tata laksana internal Kanreg III BKN Bandung.',
  timKerjaTitle = 'Tata Usaha',
  timKerjaPath = '/tim-kerja/tu',
  templateUrl = '/templates/tu/template-sample.xlsx',
  templateName = 'template-sample.xlsx',
  fetchSummaryFn,
  fetchDataFn,
  deleteDataFn,
  batchUploadFn,
  renderKpis,
  columns = [],
  renderRow,
  FormComponent,
  DetailModalComponent = null,
  onViewDetail = null,
  UploadModalComponent = null,
  isPrimaryUpload = false,
  customFilterParams = null,
  categories = [],
  defaultCategory = '',
  searchPlaceholder = 'Cari data, nomor surat, NIP, keterangan...',
  extraHeaderActions = null,
  extraFilterActions = null,
  extraToolbarControls = null,
  bannerSection = null,
  showMonthFilter = true,
  addNewLabel = 'Input Data',
  batchUploadLabel = 'Upload Data',
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
  const [viewingItem, setViewingItem] = useState(null)
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      const data = await fetchSummaryFn({
        bulan: selectedMonths,
        category: activeCategory,
        kategori: activeCategory,
        ...(customFilterParams || {}),
      })
      setSummary(data)
    } catch (err) {
      console.warn('Failed to load summary KPI:', err)
      setSummary(null)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [fetchSummaryFn, selectedMonths, activeCategory, customFilterParams])

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
        const res = await fetchDataFn({
          start,
          length: pageSize,
          search: debouncedSearch,
          bulan: selectedMonths,
          category: activeCategory,
          kategori: activeCategory,
          ...(customFilterParams || {}),
        })

        if (res && Array.isArray(res.data)) {
          setItems(res.data)
          setTotalRecords(res.recordsFiltered ?? res.recordsTotal ?? res.data.length)
        } else if (Array.isArray(res)) {
          setItems(res)
          setTotalRecords(res.length)
        } else {
          setItems([])
          setTotalRecords(0)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load table data:', err)
          setErrorMsg(err.message || 'Gagal memuat data dari server.')
        }
      } finally {
        setIsLoading(false)
        setIsReloading(false)
      }
    },
    [fetchDataFn, page, pageSize, debouncedSearch, selectedMonths, activeCategory, customFilterParams]
  )

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Edit Action
  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  // Handle Add Action
  const handleOpenAdd = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingItem || !deleteDataFn) return
    try {
      setIsDeleting(true)
      const deleteKey = deletingItem.key || deletingItem.id || deletingItem.uid
      await deleteDataFn(deleteKey)
      setDeletingItem(null)
      toast.success('Data berhasil dihapus.')
      loadData(true)
      loadSummary()
    } catch (err) {
      console.error('Failed to delete item:', err)
      toast.error(err.message || 'Gagal menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Form Success
  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    loadData(true)
    loadSummary()
  }

  // Transform KPI cards
  const kpis = useMemo(() => {
    if (!renderKpis) return []
    return renderKpis(summary)
  }, [renderKpis, summary])

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Actions (Matching /layanan/cltn & Standards) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge (HIJAU / Emerald) & Description */}
        <div className="space-y-1.5 min-w-0">
          {timKerjaTitle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
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

        {/* Action Buttons (Right - Matching /layanan/cltn) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          {/* Tombol Muat Ulang */}
          <button
            type="button"
            onClick={() => {
              loadData(true)
              loadSummary()
            }}
            disabled={isReloading || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {/* Tombol Upload Data (Otomatis Action Button jika halaman murni upload / isPrimaryUpload) */}
          {batchUploadFn && (
            <button
              type="button"
              onClick={() => setIsBatchUploadOpen(true)}
              className={
                isPrimaryUpload || !FormComponent
                  ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0'
                  : 'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0'
              }
              title={batchUploadLabel}
            >
              <FileSpreadsheet className={`w-4 h-4 ${isPrimaryUpload || !FormComponent ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{batchUploadLabel}</span>
            </button>
          )}

          {extraHeaderActions}

          {/* Tombol Input Data (Action Button / Biru BKN #175CD3) */}
          {FormComponent && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              title={addNewLabel}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{addNewLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Bento KPI Cards */}
      {kpis.length > 0 && <ServiceKpiGrid kpis={kpis} isLoading={isSummaryLoading} borderless />}

      {/* Banner Section (e.g. Warning / Himbauan / Alert di atas filter) */}
      {typeof bannerSection === 'function' ? bannerSection(summary) : bannerSection}

      {/* 3. Filter Toolbar Anti-Collision */}
      <div className="space-y-3">
        <ServiceFilterToolbar
          searchPlaceholder={searchPlaceholder}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedMonths={selectedMonths}
          onMonthChange={setSelectedMonths}
          onMonthsChange={setSelectedMonths}
          totalRecords={totalRecords}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          extraControls={extraToolbarControls}
          showMonthFilter={showMonthFilter}
          borderless
        />
        {extraFilterActions && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {extraFilterActions}
          </div>
        )}
      </div>

      {/* 4. Data Table Card Container (Matching /layanan/cltn) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-xs overflow-hidden">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{ width: col.width }}
                    className={`px-4 py-3.5 whitespace-nowrap font-bold ${col.className || ''}`}
                  >
                    {col.header || col.label || col.title || ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 font-semibold">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="py-4 px-4">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-normal">
                    {debouncedSearch || selectedMonths.length > 0 || (activeCategory && activeCategory !== defaultCategory) ? (
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Tidak ada data yang cocok dengan pencarian atau filter
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('')
                            setDebouncedSearch('')
                            setSelectedMonths([])
                            setActiveCategory(defaultCategory)
                            setPage(1)
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Belum ada data tersedia
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {FormComponent
                            ? `Gunakan tombol "${addNewLabel}" untuk menginput data baru.`
                            : batchUploadFn
                              ? `Gunakan tombol "${batchUploadLabel}" untuk mengunggah data.`
                              : 'Data belum tersedia saat ini.'}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const rowNo = (page - 1) * pageSize + idx + 1
                  const handleView = (targetItem) => {
                    const itm = targetItem || item
                    if (onViewDetail) {
                      onViewDetail(itm)
                    } else {
                      setViewingItem(itm)
                    }
                  }
                  return renderRow(
                    item,
                    rowNo,
                    () => handleOpenEdit(item),
                    () => setDeletingItem(item),
                    handleView
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer with Padding & Top Border (Identical to /layanan/cltn) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={totalRecords}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Form Modal */}
      {FormComponent && (
        <FormComponent
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setEditingItem(null)
          }}
          onSuccess={handleFormSuccess}
          initialData={editingItem}
          categories={categories}
          activeCategory={activeCategory}
        />
      )}

      {/* Batch Upload Modal */}
      {batchUploadFn && (
        UploadModalComponent ? (
          <UploadModalComponent
            isOpen={isBatchUploadOpen}
            onClose={() => setIsBatchUploadOpen(false)}
            onSuccess={() => {
              loadData(true)
              loadSummary()
            }}
            serviceTitle={serviceTitle}
            templateUrl={templateUrl}
            templateName={templateName}
            uploadFn={batchUploadFn}
          />
        ) : (
          <TuBatchUploadModal
            isOpen={isBatchUploadOpen}
            onClose={() => setIsBatchUploadOpen(false)}
            onSuccess={() => {
              loadData(true)
              loadSummary()
            }}
            serviceTitle={serviceTitle}
            templateUrl={templateUrl}
            templateName={templateName}
            uploadFn={batchUploadFn}
          />
        )
      )}

      {/* Delete Confirmation Modal */}
      <TuDeleteConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={`Hapus Data ${serviceTitle}`}
        message="Apakah Anda yakin ingin menghapus data ini dari sistem? Rekaman yang dihapus tidak dapat dipulihkan kembali."
      />

      {/* Universal Detail Modal Component */}
      {DetailModalComponent && viewingItem && (
        <DetailModalComponent
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          data={viewingItem}
          item={viewingItem}
          onSuccess={() => {
            loadData(true)
            loadSummary()
          }}
          onEdit={() => {
            const itm = viewingItem
            setViewingItem(null)
            handleOpenEdit(itm)
          }}
        />
      )}
    </div>
  )
}

export default TuCrudLayoutShell
