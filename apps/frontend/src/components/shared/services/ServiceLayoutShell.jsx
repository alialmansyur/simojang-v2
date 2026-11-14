import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { AlertCircle } from 'lucide-react'
import { ServiceHeader } from './ServiceHeader'
import { ServiceKpiGrid } from './ServiceKpiGrid'
import { ServiceFilterToolbar } from './ServiceFilterToolbar'
import { ServiceLogTable } from './ServiceLogTable'
import { ServiceUploadDialog } from './ServiceUploadDialog'
import { ServiceDetailDialog } from './ServiceDetailDialog'
import { ServiceManualEntryModal } from './ServiceManualEntryModal'
import {
  fetchServiceUploadLogs,
  fetchServiceSummary,
  deleteServiceUploadLog,
} from '../../../services/api/modularServicesApi'
import { API_BASE_URL } from '../../../services/api'

export function ServiceLayoutShell({
  layananId,
  serviceTitle = 'Layanan Kepegawaian',
  shortTitle,
  docType,
  categories = [],
  defaultCategory = '',
  sampleFile = '/templates/general/template-general.xlsx',
  sampleFileName,
  description = 'Pengelolaan dan verifikasi berkas usul kepegawaian wilayah kerja Kantor Regional III BKN Bandung.',
  timKerjaTitle = 'Pengangkatan & Mutasi',
  badgeColor,
  allowManualEntry = true,
  onManageEventsClick,
  isExcel = undefined,
  borderless = false,
}) {
  // State: Data & Filtering
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedMonths, setSelectedMonths] = useState([])
  const [activeCategory, setActiveCategory] = useState('')

  // State: Loading & Error
  const [isLoading, setIsLoading] = useState(true)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const abortControllerRef = useRef(null)

  // State: Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [selectedDetailLog, setSelectedDetailLog] = useState(null)
  const [deleteTargetLog, setDeleteTargetLog] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Escape & body scroll lock for Delete Confirmation Modal
  useEffect(() => {
    if (!deleteTargetLog) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        setDeleteTargetLog(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteTargetLog, isDeleting])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true)
      const data = await fetchServiceSummary({
        layananId,
        bulan: selectedMonths,
        docCategory: activeCategory,
      })
      setSummary(data)
    } catch (err) {
      console.warn('Failed to load summary KPI:', err)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [layananId, selectedMonths, activeCategory])

  // Load Table Data Logs
  const loadLogs = useCallback(
    async (isManualReload = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        if (isManualReload) setIsReloading(true)
        else setIsLoading(true)
        setErrorMsg('')

        const start = (page - 1) * pageSize
        const result = await fetchServiceUploadLogs({
          layananId,
          bulan: selectedMonths,
          docCategory: activeCategory,
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

        setLogs(dataRows)
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
    [layananId, selectedMonths, activeCategory, page, pageSize, debouncedSearch]
  )

  // Primary Fetch Trigger
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
      if (active) loadLogs()
    })
    return () => {
      active = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadLogs])

  // Handlers
  const handleReload = () => {
    loadSummary()
    loadLogs(true)
  }

  const handleMonthChange = (months) => {
    setSelectedMonths(months)
    setPage(1)
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setSelectedMonths([])
    setActiveCategory('')
    setPage(1)
  }

  const handleDownloadFile = (row) => {
    const rawUrl = row?.file_url
    if (rawUrl) {
      const targetUrl =
        API_BASE_URL && rawUrl.startsWith('/') ? `${API_BASE_URL}${rawUrl}` : rawUrl
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    } else {
      toast.warning('Berkas Excel fisik tidak tersedia untuk entri ini.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetLog?.id) return
    setIsDeleting(true)
    try {
      await deleteServiceUploadLog(deleteTargetLog.id)
      setDeleteTargetLog(null)
      toast.success('Log data usul berhasil dihapus.')
      loadSummary()
      loadLogs()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus log data usul.')
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilter = Boolean(selectedMonths.length > 0 || activeCategory !== '')

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <ServiceHeader
        serviceTitle={serviceTitle}
        shortTitle={shortTitle}
        description={description}
        timKerjaTitle={timKerjaTitle}
        badgeColor={badgeColor}
        onUploadClick={() => setIsUploadOpen(true)}
        onAddEntryClick={
          allowManualEntry
            ? () => {
                setEditingLog(null)
                setIsManualEntryOpen(true)
              }
            : undefined
        }
        onManageEventsClick={onManageEventsClick}
        onReloadClick={handleReload}
        isReloading={isReloading}
        borderless={borderless}
      />

      {/* 2. KPI Cards Grid */}
      <ServiceKpiGrid summary={summary} isLoading={isSummaryLoading} borderless={borderless} />

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
        totalAllRecords={summary?.total_all_files ?? totalRecords}
        categoryCounts={summary?.category_counts || {}}
        borderless={borderless}
      />

      {/* 4. Master Data Table (Standardized 5-6 Columns) */}
      <ServiceLogTable
        logs={logs}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onViewDetail={(row) => setSelectedDetailLog(row)}
        onEditLog={
          allowManualEntry
            ? (row) => {
                setEditingLog(row)
                setIsManualEntryOpen(true)
              }
            : undefined
        }
        onDownloadFile={handleDownloadFile}
        onDeleteLog={(row) => setDeleteTargetLog(row)}
        onRetry={handleReload}
        hasCategoryColumn={Boolean(categories && categories.length > 0)}
        searchTerm={debouncedSearch}
        hasActiveFilter={hasActiveFilter}
        onResetFilter={handleResetFilters}
        isExcel={isExcel}
        borderless={borderless}
        pagination={{
          page,
          pageSize,
          total: totalRecords,
          onPageChange: setPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize)
            setPage(1)
          },
        }}
      />

      {/* Manual Entry / Edit Dialog Modal (Portaled to document.body) */}
      <ServiceManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => {
          setIsManualEntryOpen(false)
          setEditingLog(null)
        }}
        layananId={layananId}
        serviceTitle={serviceTitle}
        shortTitle={shortTitle}
        categories={categories}
        defaultCategory={activeCategory || defaultCategory}
        editItem={editingLog}
        onSuccess={() => {
          loadSummary()
          loadLogs()
        }}
      />

      {/* Upload Dialog Modal (Portaled to document.body) */}
      <ServiceUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        layananId={layananId}
        serviceTitle={serviceTitle}
        docType={docType}
        categories={categories}
        defaultCategory={activeCategory || defaultCategory}
        sampleFile={sampleFile}
        sampleFileName={
          sampleFileName ||
          `${(shortTitle || serviceTitle).toLowerCase().replace(/\s+/g, '-')}-template.xlsx`
        }
        onSuccess={() => {
          loadSummary()
          loadLogs()
        }}
      />

      {/* Detail Dialog Modal (Portaled to document.body) */}
      <ServiceDetailDialog
        isOpen={Boolean(selectedDetailLog)}
        onClose={() => setSelectedDetailLog(null)}
        logItem={selectedDetailLog}
        serviceTitle={serviceTitle}
        layananId={layananId}
        onDownloadFile={handleDownloadFile}
        onEditLog={
          allowManualEntry
            ? (row) => {
                setEditingLog(row)
                setIsManualEntryOpen(true)
              }
            : undefined
        }
      />

      {/* Delete Confirmation Modal (Portaled to document.body at z-[100]) */}
      {deleteTargetLog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
            onClick={(e) => {
              if (!isDeleting && e.target === e.currentTarget) {
                setDeleteTargetLog(null)
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-log-modal-title"
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 modal-dialog-animated"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3
                  id="delete-log-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Hapus Data Usul Ini?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus arsip{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {deleteTargetLog.file_name}
                  </span>{' '}
                  beserta seluruh rincian usul instansi di dalamnya? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTargetLog(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
