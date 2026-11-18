import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Download,
} from 'lucide-react'
import { SidigiKpiGrid } from './SidigiKpiGrid'
import { SidigiBatchUploadModal } from './SidigiBatchUploadModal'
import { SidigiDeleteConfirmDialog } from './SidigiDeleteConfirmDialog'
import { SidigiDetailDialog } from './SidigiDetailDialog'
import { ServiceTablePagination } from '../ServiceTablePagination'
import { ServiceFilterToolbar } from '../ServiceFilterToolbar'
import { resolveAssetUrl } from '../../../../utils/url'

export function SidigiCrudLayoutShell({
  serviceTitle = 'Layanan Sistem Informasi & Digitalisasi',
  description = 'Pengelolaan data kepegawaian berkala, integrasi SIASN, disparitas data, dan tata kelola arsip.',
  timKerjaTitle = 'Sistem Informasi & Digitalisasi',
  templateUrl = '/templates/sidigi/template-statistik-pegawai.xlsx',
  templateName = 'template-sidigi.xlsx',
  categoryTemplates = {},
  fetchSummaryFn,
  fetchDataFn,
  fetchDetailFn,
  deleteDataFn,
  batchUploadFn,
  renderKpis,
  columns = [],
  renderRow,
  FormComponent,
  detailType = 'generic',
  categories = [],
  defaultCategory = '',
  searchPlaceholder = 'Cari data, instansi, NIP, atau berkas...',
  requiresCategory = false,
  categoryLabel = 'Kategori Dokumen / Data',
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

  // Compute active template url after activeCategory state is initialized
  const activeTemplateUrl = categoryTemplates?.[activeCategory] || templateUrl

  // State: Modals & Actions
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State: Detail Dialog
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTitle, setDetailTitle] = useState('Rincian Berkas')
  const [selectedItem, setSelectedItem] = useState(null)

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
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    if (!fetchSummaryFn) return
    try {
      setIsSummaryLoading(true)
      const data = await fetchSummaryFn({
        jenis: activeCategory || (categories.length > 0 ? categories[0].value || categories[0].id : ''),
        bulan: selectedMonths,
        doc_type: activeCategory,
      })
      setSummary(data)
    } catch (err) {
      console.warn('Failed to load SIDIGI summary KPI:', err)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [fetchSummaryFn, selectedMonths, activeCategory, categories])

  // Load Table Data with In-Flight Abort and Precise Search Filtering
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
        const result = await fetchDataFn({
          jenis: activeCategory || (categories.length > 0 ? categories[0].value || categories[0].id : ''),
          bulan: selectedMonths,
          doc_type: activeCategory,
          start,
          length: pageSize,
          search: debouncedSearch,
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
    [fetchDataFn, selectedMonths, activeCategory, categories, page, pageSize, debouncedSearch]
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

  // Filtered items fallback if frontend category filtering is needed
  const filteredItems = useMemo(() => {
    if (!activeCategory || activeCategory === 'all' || activeCategory === 'Semua') return items
    return items.filter((item) => {
      if (item.jenis) {
        return item.jenis.toLowerCase().includes(activeCategory.toLowerCase())
      }
      if (item.jenis_anomali) {
        return item.jenis_anomali.toLowerCase().includes(activeCategory.toLowerCase())
      }
      if (item.doc_type) {
        return item.doc_type.toLowerCase() === activeCategory.toLowerCase()
      }
      if (item.rw_integrasi_id) {
        return String(item.rw_integrasi_id) === String(activeCategory)
      }
      return true
    })
  }, [items, activeCategory])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {}
    if (!categories || categories.length === 0 || !items) return counts
    categories.forEach((cat) => {
      if (cat.value === 'all' || cat.value === 'Semua') {
        counts[cat.value] = items.length
      } else {
        counts[cat.value] = items.filter((item) => {
          if (item.jenis) {
            return item.jenis.toLowerCase().includes(String(cat.value).toLowerCase())
          }
          if (item.jenis_anomali) {
            return item.jenis_anomali.toLowerCase().includes(String(cat.value).toLowerCase())
          }
          if (item.doc_type) {
            return item.doc_type.toLowerCase() === String(cat.value).toLowerCase()
          }
          if (item.rw_integrasi_id) {
            return String(item.rw_integrasi_id) === String(cat.value)
          }
          return false
        }).length
      }
    })
    return counts
  }, [items, categories])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleOpenDetail = async (item) => {
    const key = item.id || item.disparitas_log_id || item.takah_log_id || item.dms_log_id || item.asn_log_id
    setSelectedItem(item)
    setDetailTitle(`Rincian: ${item.instansi_name || item.nama_instansi || item.file_name || item.period || 'Berkas Data'}`)
    setIsDetailOpen(true)

    if (fetchDetailFn && key) {
      try {
        setDetailLoading(true)
        const details = await fetchDetailFn(key)
        setDetailData(Array.isArray(details) && details.length > 0 ? details : [item])
      } catch (err) {
        console.warn('Gagal memuat detail:', err)
        setDetailData([])
      } finally {
        setDetailLoading(false)
      }
    } else {
      setDetailData([item])
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !deleteDataFn) return
    try {
      setIsDeleting(true)
      const key = deletingItem.id || deletingItem.disparitas_log_id
      await deleteDataFn(key, activeCategory)
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

  const handleDeleteDetailRow = async (row) => {
    const key = row.id || row.log_id
    if (!key || !deleteDataFn) return
    try {
      await deleteDataFn(key, activeCategory)
      toast.success('Riwayat periode berhasil dihapus.')
      if (fetchDetailFn && selectedItem) {
        const parentKey = selectedItem.id || selectedItem.disparitas_log_id || selectedItem.takah_log_id || selectedItem.dms_log_id || selectedItem.asn_log_id
        const details = await fetchDetailFn(parentKey)
        setDetailData(Array.isArray(details) && details.length > 0 ? details : [])
      }
      loadData()
      loadSummary()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus riwayat.')
    }
  }

  const handleEditDetailRow = (row) => {
    setIsDetailOpen(false)
    setEditingItem(row)
    setIsFormOpen(true)
  }

  const kpis = renderKpis ? renderKpis(summary, isSummaryLoading) : []

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Actions (Matching /layanan/cltn & /layanan/wasdal-netralitas) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        {/* Action Buttons (Right Cluster matching SSOT) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleManualReload}
            disabled={isReloading || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {activeTemplateUrl && (
            <a
              href={resolveAssetUrl(activeTemplateUrl)}
              download={activeTemplateUrl.split('/').pop() || templateName}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Unduh Format Sampel Excel"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Format Sampel</span>
            </a>
          )}

          {FormComponent ? (
            <>
              {/* Tombol Pendamping: Upload Data (Sekunder, icon emerald) */}
              <button
                type="button"
                onClick={() => setIsBatchUploadOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Upload Data (Batch Excel)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Data</span>
              </button>

              {/* Tombol Utama: Input Data (Primer Biru BKN #175CD3, icon Plus putih stroke-[2.5]) */}
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
            /* Tombol Aksi Primer Upload Data jika tanpa form manual */
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

      {/* 2. 4 Bento KPI Cards */}
      <SidigiKpiGrid kpis={kpis} summary={summary} isLoading={isSummaryLoading} />

      {/* 3. Filter Toolbar Dinamis (Pencarian, Multi-Bulan & Category Pills) */}
      <ServiceFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        selectedMonths={selectedMonths}
        onMonthChange={handleMonthChange}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        categoryCounts={categoryCounts}
        totalRecords={totalRecords}
        borderless
      />

      {/* 4. Data Table Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/50 shadow-2xs overflow-hidden">
        {/* Error State Banner inside container header */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 font-semibold">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleManualReload}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 transition-colors cursor-pointer shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={col.width ? { width: col.width } : {}}
                    className={`py-3.5 px-4 sm:px-5 ${col.className || ''}`}
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
                      <td key={cIdx} className="py-4 px-4">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Belum ada data pada filter atau periode ini
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        Klik tombol Input Data atau Upload Data Batch di atas, atau ubah filter pencarian
                      </p>
                      {(searchTerm || selectedMonths.length > 0 || (activeCategory && activeCategory !== defaultCategory && activeCategory !== 'all')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedMonths([])
                            setActiveCategory(defaultCategory)
                            setPage(1)
                          }}
                          className="mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Reset Filter & Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) =>
                  renderRow(
                    item,
                    (page - 1) * pageSize + idx + 1,
                    handleOpenEdit,
                    (it) => setDeletingItem(it),
                    handleOpenDetail
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer (Matching /layanan/manajemen-talenta) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={
              activeCategory && activeCategory !== 'all' && activeCategory !== 'Semua'
                ? filteredItems.length
                : totalRecords
            }
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Batch Upload Modal */}
      <SidigiBatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        onSuccess={() => {
          loadData()
          loadSummary()
        }}
        serviceTitle={serviceTitle}
        templateUrl={activeTemplateUrl || templateUrl}
        templateName={templateName}
        categoryTemplates={categoryTemplates}
        activeCategory={activeCategory}
        uploadFn={batchUploadFn}
        categories={categories}
        requiresCategory={requiresCategory}
        categoryLabel={categoryLabel}
      />

      {/* Form Dialog Modal for Direct Manual Entry */}
      {FormComponent && (
        <FormComponent
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            loadData()
            loadSummary()
          }}
          editingItem={editingItem}
          serviceTitle={serviceTitle}
        />
      )}

      {/* Detail Dialog Drawer for Sub-rows & Breakdown */}
      <SidigiDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detailTitle}
        data={detailData}
        isLoading={detailLoading}
        type={detailType}
        selectedItem={selectedItem}
        onEditRow={handleEditDetailRow}
        onDeleteRow={handleDeleteDetailRow}
      />

      {/* Delete Confirmation Modal */}
      <SidigiDeleteConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Hapus Data Layanan"
        message="Apakah Anda yakin ingin menghapus arsip/entri data ini dari sistem SIMOJANG? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  )
}
