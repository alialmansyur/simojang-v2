import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  FileSpreadsheet,
} from 'lucide-react'
import { PmaKpiGrid } from './PmaKpiGrid'
import { PmaBatchUploadModal } from './PmaBatchUploadModal'
import { PmaDeleteConfirmDialog } from './PmaDeleteConfirmDialog'
import { PmaDetailDialog } from './PmaDetailDialog'
import { PmaTableHeader } from './PmaTableCells'
import { ServiceTablePagination } from '../ServiceTablePagination'
import { ServiceFilterToolbar } from '../ServiceFilterToolbar'

export function PmaCrudLayoutShell({
  serviceTitle = 'Layanan Pembinaan Manajemen ASN',
  shortTitle,
  description = 'Pengelolaan talenta, evaluasi kinerja, pengembangan kompetensi, dan disiplin ASN wilayah kerja.',
  timKerjaTitle = 'Pembinaan Manajemen ASN',
  templateUrl = '/templates/pma/template-manajemen-talenta.xlsx',
  templateName = 'template-pma.xlsx',
  fetchSummaryFn,
  fetchDataFn,
  deleteDataFn,
  batchUploadFn,
  renderKpis,
  columns = [],
  renderRow,
  renderDetail = null,
  FormComponent = null,
  categories = [],
  defaultCategory = '',
  showYearFilter = false,
  defaultYear = 'ALL',
  yearOptions = ['ALL', '2026', '2025', '2024', '2023', '2022'],
  searchPlaceholder = 'Cari data, nama instansi, materi...',
  formSupportProps = {},
  tableHeaderWeightClass = 'font-bold',
  tableBodyClassName = '',
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
  const [selectedYear, setSelectedYear] = useState(defaultYear)
  const [activeCategory, setActiveCategory] = useState(defaultCategory)

  // State: Modals & Actions
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State: Modal Detail
  const [detailItem, setDetailItem] = useState(null)
  const [detailPayload, setDetailPayload] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailErrorMsg, setDetailErrorMsg] = useState('')

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

  // Filter kategori aktif → parameter backend.
  // `jenis_layanan` hanyaexpects nama jenis (ASISTENSI/KONSULTASI/REGULASI),
  // sehingga kategori numerik (kategori_id) TIDAK boleh diteruskan ke sana.
  const categoryParams = useMemo(() => {
    const isNumeric = /^\d+$/.test(String(activeCategory ?? '').trim())
    return {
      kategori_id: activeCategory ? Number(activeCategory) || 0 : 0,
      category: activeCategory,
      kategori: activeCategory,
      metode: activeCategory,
      jenis_layanan: isNumeric || !activeCategory ? 'ALL' : activeCategory,
    }
  }, [activeCategory])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    if (!fetchSummaryFn) return
    try {
      setIsSummaryLoading(true)
      const data = await fetchSummaryFn({
        bulan: selectedMonths,
        period_months: selectedMonths,
        period_year: selectedYear,
        ...categoryParams,
      })
      setSummary(data)
    } catch (err) {
      console.warn('Failed to load PMA summary KPI:', err)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [fetchSummaryFn, selectedMonths, selectedYear, categoryParams])

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
        const result = await fetchDataFn({
          bulan: selectedMonths,
          period_months: selectedMonths,
          period_year: selectedYear,
          ...categoryParams,
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
    [fetchDataFn, selectedMonths, selectedYear, categoryParams, page, pageSize, debouncedSearch]
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

  const handleYearChange = (year) => {
    setSelectedYear(year)
    setPage(1)
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    setPage(1)
  }

  // Kolom tabel adaptif sesuai spesifikasi domain layanan
  const visibleColumns = useMemo(() => columns, [columns])

  const hasActiveFilter = useMemo(() => {
    return (
      Boolean(debouncedSearch.trim()) ||
      selectedMonths.length > 0 ||
      Boolean(selectedYear && selectedYear !== defaultYear) ||
      Boolean(activeCategory && activeCategory !== 'all' && activeCategory !== defaultCategory)
    )
  }, [debouncedSearch, selectedMonths, selectedYear, defaultYear, activeCategory, defaultCategory])

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setSelectedMonths([])
    setSelectedYear(defaultYear)
    setActiveCategory(defaultCategory)
    setPage(1)
  }

  // Cocokkan satu item dengan kategori untuk perhitungan badge count fallback.
  const matchesCategory = useCallback((item, cat) => {
    if (!cat || cat === 'all') return true

    const needle = String(cat).trim().toLowerCase()
    const isNumericCat = /^\d+$/.test(needle)

    // 1. Match eksplisit via array `values` pada definisi kategori.
    const catDef = categories.find((c) => String(c.value) === String(cat))
    if (catDef && Array.isArray(catDef.values) && catDef.values.length > 0) {
      const candidates = [item.metode, item.jenis_penilaian, item.kategori_nama, item.jenis_layanan].filter(
        Boolean
      )
      return candidates.some((c) =>
        catDef.values.some((v) => String(c).toLowerCase() === String(v).toLowerCase())
      )
    }

    // 2. Kunci numerik kategori (kategori_id / rw_mt_id).
    if (isNumericCat) {
      if (item.kategori_id !== undefined && item.kategori_id !== null) {
        return String(item.kategori_id) === needle
      }
      if (item.rw_mt_id !== undefined && item.rw_mt_id !== null) {
        return String(item.rw_mt_id) === needle
      }
    }

    // 3. Jenis layanan Disiplin/Budaya/Citra (ASISTENSI, KONSULTASI, REGULASI, PEMBINAAN).
    if (item.jenis_layanan) {
      return String(item.jenis_layanan).trim().toLowerCase() === needle
    }

    // 4. Tahapan MT (mandiri / pendampingan).
    if (item.rw_mt_id !== undefined && item.rw_mt_id !== null) {
      if (needle === 'mandiri') return Number(item.rw_mt_id) >= 7
      if (needle === 'pendampingan') return Number(item.rw_mt_id) < 7
    }

    // 5. Metode Pengembangan / Penilaian Kompetensi.
    if (item.metode) {
      const m = String(item.metode).trim().toLowerCase()
      if (needle === 'klasikal') return ['klasikal', 'tatap muka', 'offline'].includes(m)
      if (needle === 'daring') return ['daring (zoom)', 'daring', 'online'].includes(m)
      if (needle === 'hybrid') return m === 'hybrid'
      return m.includes(needle)
    }

    // 6. Jenis Penilaian Karier.
    if (item.jenis_penilaian) {
      const jp = String(item.jenis_penilaian).trim().toLowerCase()
      if (needle === 'ud') return jp.includes('ud') || jp.includes('ujian dinas')
      if (needle === 'upkp') return jp.includes('upkp') || jp.includes('penyesuaian ijazah')
      if (needle === 'seleksi-terbuka') return jp.includes('seleksi')
      if (needle === 'uji-kelayakan') return jp.includes('kelayakan')
      if (needle === 'evaluasi-kinerja') return jp.includes('evaluasi')
      return jp.includes(needle)
    }
    return true
  }, [categories])

  // Data tabel sudah difilter secara server-side melalui parameter API
  const filteredItems = items

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {}
    if (!categories || categories.length === 0 || !items) return counts
    const hasMtSummary =
      !debouncedSearch &&
      summary &&
      summary.tahap_mandiri !== undefined &&
      summary.tahap_pendampingan !== undefined

    categories.forEach((cat) => {
      if (cat.value === 'all') {
        counts[cat.value] = !debouncedSearch && summary?.total_data !== undefined
          ? summary.total_data
          : items.length
      } else if (cat.value === 'mandiri') {
        counts[cat.value] = hasMtSummary
          ? Number(summary.tahap_mandiri || 0)
          : items.filter((i) => Number(i.rw_mt_id || 0) >= 7).length
      } else if (cat.value === 'pendampingan') {
        counts[cat.value] = hasMtSummary
          ? Number(summary.tahap_pendampingan || 0)
          : items.filter((i) => Number(i.rw_mt_id || 0) < 7).length
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'klasikal' &&
        summary.total_tatap_muka !== undefined
      ) {
        counts[cat.value] = Number(summary.total_tatap_muka || 0)
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'daring' &&
        summary.total_online !== undefined
      ) {
        counts[cat.value] = Number(summary.total_online || 0)
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'hybrid' &&
        summary.total_hybrid !== undefined
      ) {
        counts[cat.value] = Number(summary.total_hybrid || 0)
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'ASISTENSI' &&
        summary.total_asistensi !== undefined
      ) {
        counts[cat.value] = Number(summary.total_asistensi || 0)
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'KONSULTASI' &&
        summary.total_konsultasi !== undefined
      ) {
        counts[cat.value] = Number(summary.total_konsultasi || 0)
      } else if (
        !debouncedSearch &&
        summary &&
        cat.value === 'REGULASI' &&
        summary.total_regulasi !== undefined
      ) {
        counts[cat.value] = Number(summary.total_regulasi || 0)
      } else {
        counts[cat.value] = items.filter((item) => matchesCategory(item, cat.value)).length
      }
    })
    return counts
  }, [items, categories, matchesCategory, summary, debouncedSearch])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  // Buka Modal Detail (klik tombol Eye atau Judul Instansi)
  const handleOpenDetail = async (item) => {
    setDetailItem(item)
    setDetailPayload(null)
    setDetailErrorMsg('')

    if (!renderDetail) return

    try {
      setIsDetailLoading(true)
      const payload = await renderDetail(item)
      setDetailPayload(payload)
    } catch (err) {
      console.warn('Gagal memuat detail PMA:', err)
      setDetailErrorMsg(err.message || 'Gagal memuat rincian detail.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailItem(null)
    setDetailPayload(null)
    setDetailErrorMsg('')
    setIsDetailLoading(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !deleteDataFn) return
    try {
      setIsDeleting(true)
      await deleteDataFn(deletingItem.uid || deletingItem.id)
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

  const kpis = renderKpis ? renderKpis(summary, isSummaryLoading) : []

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Actions (Matching /layanan/wasdal-netralitas) */}
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

        {/* Action Buttons (Right - Header Bar adhering to SIMOJANG Master SSOT) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleManualReload}
            disabled={isReloading || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {FormComponent ? (
            <>
              {/* Tombol Pendamping: Upload Data (Sekunder, icon emerald) */}
              <button
                type="button"
                onClick={() => setIsBatchUploadOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
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
      <PmaKpiGrid kpis={kpis} isLoading={isSummaryLoading} />

      {/* 3. Filter Toolbar (Seragam dengan /layanan/wasdal-netralitas) */}
      <ServiceFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        selectedMonths={selectedMonths}
        onMonthChange={handleMonthChange}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        totalRecords={totalRecords}
        categoryCounts={categoryCounts}
        placeholder={searchPlaceholder}
        borderless
        extraControls={
          showYearFilter ? (
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3] transition-all cursor-pointer shadow-2xs"
                title="Pilih Periode Tahun"
              >
                <option value="ALL">Semua Periode Tahun</option>
                {yearOptions
                  .filter((y) => String(y).toUpperCase() !== 'ALL')
                  .map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
              </select>
            </div>
          ) : null
        }
      />

      {/* 4. Data Table (Standard Card Container with Encapsulated Error Banner, Header, Rows, & Footer) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Error State Banner inside container header */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 font-medium">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="truncate">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleManualReload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 ${tableHeaderWeightClass} uppercase tracking-wider text-[11px]`}>
                {visibleColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-3.5 px-4 sm:px-5 ${col.className || ''}`}
                    style={col.width ? { width: col.width } : {}}
                  >
                    {typeof col.header === 'string' ? (
                      <PmaTableHeader label={col.header} align={col.align} />
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 ${tableBodyClassName}`}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {visibleColumns.map((_, cIdx) => (
                      <td key={cIdx} className="py-4 px-4">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : errorMsg && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length || 5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto px-4">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Gagal Memuat Data Layanan
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {errorMsg}
                      </p>
                      <button
                        type="button"
                        onClick={handleManualReload}
                        className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Muat Ulang Data</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length || 5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto px-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className={`text-xs sm:text-sm ${tableBodyClassName ? 'font-semibold' : 'font-bold'} text-slate-700 dark:text-slate-200`}>
                        {hasActiveFilter
                          ? 'Tidak Ada Data yang Sesuai Filter'
                          : 'Belum Ada Data Tercatat'}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        {hasActiveFilter
                          ? 'Coba ubah kata kunci pencarian, kategori, atau filter bulan untuk menampilkan data lainnya.'
                          : 'Klik tombol Input Data atau Upload Data di bagian atas untuk menambahkan data baru.'}
                      </p>
                      {hasActiveFilter && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reset Filter</span>
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
                    setDeletingItem,
                    handleOpenDetail
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Wasdal) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={totalRecords || filteredItems.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* 5. Modals */}
      {FormComponent && isFormOpen && (
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
          initialData={editingItem}
          {...formSupportProps}
        />
      )}

      {isBatchUploadOpen && (
        <PmaBatchUploadModal
          isOpen={isBatchUploadOpen}
          onClose={() => setIsBatchUploadOpen(false)}
          onSuccess={() => {
            loadData()
            loadSummary()
          }}
          onUploadSuccess={() => {
            loadData()
            loadSummary()
          }}
          serviceTitle={serviceTitle}
          templateUrl={templateUrl}
          sampleFile={templateUrl}
          templateName={templateName}
          sampleFileName={templateName}
          uploadFn={batchUploadFn}
          uploadApiFn={batchUploadFn}
        />
      )}

      {deletingItem && (
        <PmaDeleteConfirmDialog
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          title={`Hapus Data ${shortTitle || serviceTitle}`}
          description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini akan menghapus entri dari database dan memperbarui rekapitulasi capaian."
        />
      )}

      {/* 6. Modal Detail (Progressive Disclosure — rincian teknis dipindah dari tabel utama) */}
      {detailItem && (
        <PmaDetailDialog
          isOpen={Boolean(detailItem)}
          onClose={handleCloseDetail}
          serviceTitle={serviceTitle}
          detail={
            detailPayload || {
              title:
                detailItem.instansi_name ||
                detailItem.instansi_nama ||
                detailItem.judul_kegiatan ||
                'Detail Data',
              subtitle: serviceTitle,
            }
          }
          isLoading={isDetailLoading}
          errorMsg={detailErrorMsg}
        />
      )}
    </div>
  )
}
