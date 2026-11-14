import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Layers,
  X,
} from 'lucide-react'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { AnggaranFormModal } from './components/AnggaranFormModal'
import { AnggaranDetailModal } from './components/AnggaranDetailModal'
import {
  fetchAnggaranSummary,
  fetchAnggaranData,
  deleteAnggaranData,
  fetchAnggaranOptions,
} from '../../../services/api/tuServicesApi'

export default function AnggaranRealisasiPage() {
  const navigate = useNavigate()

  // Transactions Table State
  const [items, setItems] = useState([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // KPI Summary State
  const [summary, setSummary] = useState(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)

  // Filters State
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [dateMode, setDateMode] = useState('sp2d') // 'sp2d' | 'spm'
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' | 'POSTED' | 'PENDING'

  // Year Dropdown Options
  const [yearOptions, setYearOptions] = useState([])

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format Helpers
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Load Year Options
  useEffect(() => {
    fetchAnggaranOptions()
      .then((res) => {
        if (res?.years?.length) {
          setYearOptions(res.years)
          const activeYr = res.years.find((y) => Number(y.is_active || 0) === 1) || res.years[0]
          setSelectedYear(String(activeYr.tahun))
        }
      })
      .catch((err) => console.warn('Gagal memuat opsi tahun anggaran:', err))
  }, [])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true)
    try {
      const res = await fetchAnggaranSummary({
        tahun: selectedYear || undefined,
        date_mode: dateMode,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })
      setSummary(res)
    } catch (err) {
      console.warn('Gagal memuat ringkasan anggaran:', err)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [selectedYear, dateMode, dateStart, dateEnd])

  // Load Table Data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchAnggaranData({
        start: (page - 1) * pageSize,
        length: pageSize,
        search,
        tahun: selectedYear || undefined,
        date_mode: dateMode,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
        status: statusFilter || undefined,
      })
      setItems(Array.isArray(res.data) ? res.data : [])
      setTotalRecords(Number(res.recordsFiltered ?? res.recordsTotal ?? 0))
    } catch (err) {
      toast.error(err.message || 'Gagal memuat data transaksi realisasi anggaran.')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search, selectedYear, dateMode, dateStart, dateEnd, statusFilter])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await deleteAnggaranData(deletingItem.id)
      toast.success('Transaksi anggaran berhasil dihapus.')
      setDeletingItem(null)
      loadData()
      loadSummary()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus transaksi anggaran.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Reset Date Filters
  const handleResetDates = () => {
    setDateStart('')
    setDateEnd('')
  }

  // Active Pill Classes
  const activePillClass =
    'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#175CD3] text-white shadow-2xs transition-all cursor-pointer'
  const inactivePillClass =
    'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer'

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Page Standard (Matching /layanan/fasilitasi-cat) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Bagian Tata Usaha</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Realisasi Anggaran DIPA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Pencatatan realisasi SPM dan SP2D, alokasi akun belanja, serta pemantauan batas pagu belanja Kantor Regional III BKN.
          </p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate('/layanan/anggaran')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-slate-800/70"
            title="Kembali ke Portal Anggaran"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loadData()
              loadSummary()
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-slate-800/70 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setIsFormModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Input Transaksi SPM"
          >
            <Plus className="w-4 h-4 stroke-[2.5] text-white" />
            <span>Input SPM</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Pagu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TOTAL PAGU DIPA</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatRupiah(summary?.total_pagu_efektif ?? summary?.total_pagu_revisi ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alokasi DIPA TA {selectedYear || summary?.tahun || 'Aktif'}
          </div>
        </div>

        {/* Realisasi SP2D */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>REALISASI SP2D</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
            {formatRupiah(summary?.total_realisasi_posted || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dana belanja terserap s.d. saat ini</div>
        </div>

        {/* Sisa Pagu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>SISA PAGU EFEKTIF</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
            {formatRupiah(summary?.sisa_pagu_efektif || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Saldo pagu yang dapat dicairkan</div>
        </div>

        {/* Persen Capaian / Target */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>CAPAIAN / TARGET</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {Number(summary?.realisasi_persen || 0).toFixed(2)}% / {summary?.target_persen ?? 95}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Deviasi IKPA: {summary?.gap_target_persen ?? 0}%
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Segmented Tabs Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3.5">
        {/* Tier 1: Search & Date Controls */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari No. SPM, SP2D, keterangan..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
              />
            </div>

            {/* Tahun Filter */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y.id} value={y.tahun}>
                  Tahun {y.tahun}
                </option>
              ))}
            </select>

            {/* Acuan Tanggal */}
            <select
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="sp2d">Acuan Tgl SP2D</option>
              <option value="spm">Acuan Tgl SPM</option>
            </select>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="date"
                value={dateStart}
                onChange={(e) => {
                  setDateStart(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <span>s.d.</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => {
                  setDateEnd(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              {(dateStart || dateEnd) && (
                <button
                  type="button"
                  onClick={handleResetDates}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  title="Reset Filter Tanggal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Segmented Navigation Pills Strip */}
        <div className="w-full pt-2.5 border-t border-slate-100 dark:border-slate-800 overflow-x-auto clean-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('')
                setPage(1)
              }}
              className={!statusFilter ? activePillClass : inactivePillClass}
            >
              Semua Transaksi ({totalRecords})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('POSTED')
                setPage(1)
              }}
              className={statusFilter === 'POSTED' ? activePillClass : inactivePillClass}
            >
              Posted / Terbit SP2D
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('PENDING')
                setPage(1)
              }}
              className={statusFilter === 'PENDING' ? activePillClass : inactivePillClass}
            >
              Pending / Verifikasi
            </button>
          </div>
        </div>
      </div>

      {/* 4. Unified Data Table (Matching /rekap-data) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-5">DOKUMEN SPM & SP2D</th>
                <th className="py-3.5 px-4">STRUKTUR BELANJA</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">NILAI REALISASI</th>
                <th className="py-3.5 px-4">TANGGAL</th>
                <th className="py-3.5 px-4">PETUGAS</th>
                <th className="py-3.5 px-4 sm:px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-5">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-right">
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      Tidak ada data transaksi realisasi anggaran
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol "Input SPM" di kanan atas untuk membuat pencatatan transaksi baru.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const status = (row.status || 'POSTED').toUpperCase()
                  let statusBadge =
                    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  if (status === 'DRAFT' || status === 'PENDING') {
                    statusBadge =
                      'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                  } else if (status === 'VOID') {
                    statusBadge =
                      'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
                  }

                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. DOKUMEN SPM & SP2D */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <TuDataOriginIcon isExcel={true} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setDetailItem(row)}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer font-mono"
                              title={row.no_spm || '-'}
                            >
                              SPM: {row.no_spm || '-'}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate max-w-xs">
                              <span>SP2D: {row.no_sp2d || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. STRUKTUR BELANJA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 font-mono">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{row.kode_mak || row.mak || row.struktur_kode || 'Multi-Akun'}</span>
                        </span>
                        {row.total_items > 1 && (
                          <span className="ml-1.5 text-[11px] text-slate-400">
                            ({row.total_items} akun)
                          </span>
                        )}
                      </td>

                      {/* 3. STATUS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* 4. TOTAL REALISASI */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {formatRupiah(row.total_nominal || row.nominal || 0)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          Tahun Anggaran {row.tahun || selectedYear || '-'}
                        </div>
                      </td>

                      {/* 5. TANGGAL */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <TuTanggalCell value={row.sp2d_date || row.period_date || row.spm_date || row.created_at} />
                      </td>

                      {/* 6. PETUGAS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <TuPetugasCell value={row.petugas || row.created_by || row.operator || 'Bendahara Pengeluaran'} />
                      </td>

                      {/* 7. AKSI */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Lihat Detail Realisasi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(row)
                              setIsFormModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ubah Transaksi"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
            <ServiceTablePagination
              page={page}
              pageSize={pageSize}
              totalRecords={totalRecords}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnggaranFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingItem(null)
        }}
        onSuccess={() => {
          toast.success('Data transaksi anggaran berhasil disimpan.')
          setIsFormModalOpen(false)
          setEditingItem(null)
          loadData()
          loadSummary()
        }}
        initialData={editingItem}
      />

      {/* Detail Modal */}
      <AnggaranDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        data={detailItem}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm modal-dialog-animated text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Transaksi Realisasi?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Yakin ingin menghapus dokumen SPM <strong>{deletingItem.no_spm || '-'}</strong>?
                  Data item belanja terkait akan ikut terhapus dari pembukuan.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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
