import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Target,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  ExternalLink,
  Layers,
  Briefcase,
  Search,
  Filter,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  FolderOpen,
  FolderClosed,
} from 'lucide-react'
import { ServiceHeader } from '../../../components/shared/services/ServiceHeader'
import { KpiCardGrid } from '../../../components/shared/services/KpiCard'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { TuDeleteConfirmDialog } from '../../../components/shared/services/tu/TuDeleteConfirmDialog'
import { TuBatchUploadModal } from '../../../components/shared/services/tu/TuBatchUploadModal'
import { IkkTransaksiModal } from './components/IkkTransaksiModal'
import { IkkSasaranModal } from './components/IkkSasaranModal'
import { IkkIndikatorModal } from './components/IkkIndikatorModal'
import { IkkKegiatanModal } from './components/IkkKegiatanModal'
import { IkkDetailModal } from './components/IkkDetailModal'
import { IkkHierarchyTreeView } from './components/IkkHierarchyTreeView'
import {
  fetchIkkSummary,
  fetchIkkTransaksi,
  deleteIkkTransaksi,
  storeIkkTransaksiBatch,
  fetchIkkSasaran,
  deleteIkkSasaran,
  fetchIkkIndikator,
  deleteIkkIndikator,
  fetchIkkKegiatan,
  deleteIkkKegiatan,
  fetchIkkOptionsTahun,
} from '../../../services/api/tuServicesApi'

const PERIODE_TRIWULAN_OPTIONS = [
  { value: '', label: 'Semua Periode (1 Tahun Penuh)' },
  { value: '1', label: 'Triwulan I (Januari-Maret)' },
  { value: '2', label: 'Semester I (Januari-Juni)' },
  { value: '3', label: 'Triwulan III (Januari-September)' },
  { value: '4', label: 'Tahunan (Januari-Desember)' },
]

export default function IkkPage() {
  const currentYear = new Date().getFullYear().toString()

  // 1. Navigation & Filter State
  const [activeTab, setActiveTab] = useState('transaksi') // 'transaksi' | 'sasaran' | 'indikator' | 'kegiatan' | 'tree'
  const [filterTahun, setFilterTahun] = useState(currentYear)
  const [filterTriwulan, setFilterTriwulan] = useState('')
  const [availableYears, setAvailableYears] = useState([currentYear, '2025', '2024'])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // 2. Table & Pagination State per Tab
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [tableData, setTableData] = useState([])
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [tableError, setTableError] = useState('')

  // 3. KPI Summary State
  const [summary, setSummary] = useState(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)

  // 4. Modal States
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false)
  const [isSasaranModalOpen, setIsSasaranModalOpen] = useState(false)
  const [isIndikatorModalOpen, setIsIndikatorModalOpen] = useState(false)
  const [isKegiatanModalOpen, setIsKegiatanModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Edit / Delete State
  const [selectedItem, setSelectedItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load available years
  useEffect(() => {
    let mounted = true
    fetchIkkOptionsTahun()
      .then((years) => {
        if (!mounted || !Array.isArray(years) || years.length === 0) return
        const normalized = years.map((y) => (typeof y === 'object' ? String(y.id || y.tahun || y.value) : String(y)))
        if (!normalized.includes(currentYear)) {
          normalized.unshift(currentYear)
        }
        setAvailableYears(normalized)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [currentYear])

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true)
      const data = await fetchIkkSummary({
        tahun: filterTahun,
        triwulan: filterTriwulan,
      })
      setSummary(data)
    } catch (err) {
      console.warn('Gagal memuat ringkasan KPI IKK:', err)
      setSummary(null)
    } finally {
      setIsSummaryLoading(false)
    }
  }, [filterTahun, filterTriwulan])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Load Table Data based on activeTab
  const loadTableData = useCallback(async () => {
    if (activeTab === 'tree') {
      setIsTableLoading(false)
      return
    }

    try {
      setIsTableLoading(true)
      setTableError('')

      const params = {
        start: (page - 1) * pageSize,
        length: pageSize,
        search: debouncedSearch,
        tahun: filterTahun,
        triwulan: filterTriwulan,
      }

      let res = null
      if (activeTab === 'transaksi') {
        res = await fetchIkkTransaksi(params)
      } else if (activeTab === 'sasaran') {
        res = await fetchIkkSasaran(params)
      } else if (activeTab === 'indikator') {
        res = await fetchIkkIndikator(params)
      } else if (activeTab === 'kegiatan') {
        res = await fetchIkkKegiatan(params)
      }

      setTableData(res?.data || [])
      setTotalRecords(Number(res?.recordsFiltered ?? res?.recordsTotal ?? 0))
    } catch (err) {
      console.warn(`Gagal memuat data tabel [${activeTab}]:`, err)
      setTableData([])
      setTotalRecords(0)
      setTableError(err?.message || 'Gagal memuat data dari server.')
    } finally {
      setIsTableLoading(false)
    }
  }, [activeTab, page, pageSize, debouncedSearch, filterTahun, filterTriwulan])

  useEffect(() => {
    loadTableData()
  }, [loadTableData])

  // Reset pagination on tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setPage(1)
    setSearchTerm('')
    setDebouncedSearch('')
  }

  // Reload action
  const handleReload = () => {
    loadSummary()
    loadTableData()
  }

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    const id = deletingItem.id || deletingItem.key
    try {
      setIsDeleting(true)
      if (activeTab === 'transaksi') {
        await deleteIkkTransaksi(id)
      } else if (activeTab === 'sasaran') {
        await deleteIkkSasaran(id)
      } else if (activeTab === 'indikator') {
        await deleteIkkIndikator(id)
      } else if (activeTab === 'kegiatan') {
        await deleteIkkKegiatan(id)
      }
      setDeletingItem(null)
      loadSummary()
      loadTableData()
    } catch (err) {
      alert(err.message || 'Gagal menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Format Helpers
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

  // KPI Items
  const kpiItems = [
    {
      id: 'total_sasaran',
      label: 'TOTAL SASARAN STRATEGIS',
      value: summary?.total_sasaran ?? 7,
      unit: 'Sasaran',
      context: 'Renstra Kanreg III BKN',
      badge: 'Renstra',
      badgeColor: 'blue',
      icon: Target,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_indikator',
      label: 'INDIKATOR KINERJA (IKK)',
      value: summary?.total_indikator ?? 18,
      unit: 'IKK',
      context: 'Mencakup seluruh Tim Kerja',
      badge: 'Target IKK',
      badgeColor: 'indigo',
      icon: Layers,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_kegiatan',
      label: 'KEGIATAN OPERASIONAL',
      value: summary?.total_kegiatan ?? 121,
      unit: 'Kegiatan',
      context: `${summary?.tanpa_pengampu ?? 0} belum ada pengampu`,
      badge: 'Operasional',
      badgeColor: 'amber',
      icon: Briefcase,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'avg_capaian',
      label: 'RATA-RATA CAPAIAN IKK',
      value: `${summary?.avg_progres ?? summary?.avg_capaian ?? 0}%`,
      unit: '',
      isText: true,
      context: filterTriwulan
        ? PERIODE_TRIWULAN_OPTIONS.find((p) => p.value === filterTriwulan)?.label || 'Periode Triwulan'
        : 'Akumulasi Tahunan',
      badge: Number(summary?.avg_progres ?? 0) >= 100 ? 'Melampaui' : 'Realisasi',
      badgeColor: Number(summary?.avg_progres ?? 0) >= 100 ? 'emerald' : 'blue',
      icon: TrendingUp,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
  ]

  // Tab Navigation Definitions with badge counts
  const tabs = [
    {
      key: 'transaksi',
      label: 'Transaksi',
      count: summary?.total_transaksi ?? (activeTab === 'transaksi' ? totalRecords : 2),
      badgeColor: 'bg-blue-100 text-[#175CD3] dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      key: 'sasaran',
      label: 'Sasaran',
      count: summary?.total_sasaran ?? (activeTab === 'sasaran' ? totalRecords : 7),
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      key: 'indikator',
      label: 'Indikator',
      count: summary?.total_indikator ?? (activeTab === 'indikator' ? totalRecords : 18),
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      key: 'kegiatan',
      label: 'Kegiatan & Pengampu',
      count: summary?.total_kegiatan ?? (activeTab === 'kegiatan' ? totalRecords : 121),
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      key: 'tree',
      label: 'Matriks Monitoring',
      count: null,
      badgeColor: '',
    },
  ]

  // Primary action button config per tab
  const getPrimaryAction = () => {
    switch (activeTab) {
      case 'transaksi':
        return {
          label: 'Input Capaian',
          onClick: () => {
            setSelectedItem(null)
            setIsTransaksiModalOpen(true)
          },
        }
      case 'sasaran':
        return {
          label: 'Tambah Sasaran',
          onClick: () => {
            setSelectedItem(null)
            setIsSasaranModalOpen(true)
          },
        }
      case 'indikator':
        return {
          label: 'Tambah Indikator',
          onClick: () => {
            setSelectedItem(null)
            setIsIndikatorModalOpen(true)
          },
        }
      case 'kegiatan':
        return {
          label: 'Tambah Kegiatan',
          onClick: () => {
            setSelectedItem(null)
            setIsKegiatanModalOpen(true)
          },
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()

  return (
    <div className="space-y-4">
      {/* AREA 1: SERVICE HEADER */}
      <ServiceHeader
        serviceTitle="Manajemen Capaian IKK"
        description="Monitoring capaian indikator kinerja kegiatan, sasaran strategis Renstra, dan log eviden Kanreg III BKN."
        timKerjaTitle="Bagian Tata Usaha"
        badgeColor="emerald"
        onReloadClick={handleReload}
        isReloading={isTableLoading || isSummaryLoading}
        onUploadClick={activeTab === 'transaksi' ? () => setIsUploadModalOpen(true) : null}
        uploadLabel="Upload Data"
        onAddEntryClick={primaryAction?.onClick}
        addEntryLabel={primaryAction?.label || 'Input Data'}
      />

      {/* AREA 2: 4 BENTO KPI CARDS */}
      <KpiCardGrid kpis={kpiItems} isLoading={isSummaryLoading} borderless />

      {/* AREA 3: UNIFIED FILTER TOOLBAR (Tier 1 & Tier 2) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs p-3.5 sm:p-4 space-y-3">
        {/* Tier 1: Search & Period Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'transaksi'
                  ? 'Cari pelaksana harian, kegiatan, eviden...'
                  : activeTab === 'sasaran'
                    ? 'Cari rumusan sasaran strategis...'
                    : activeTab === 'indikator'
                      ? 'Cari nama indikator kinerja, sasaran...'
                      : activeTab === 'kegiatan'
                        ? 'Cari kegiatan operasional, tim pengampu...'
                        : 'Pencarian pohon kinerja...'
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Filter Periode: Tahun & Triwulan */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Tahun Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="filter-tahun-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">Tahun:</label>
              <select
                id="filter-tahun-select"
                aria-label="Filter Tahun"
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#175CD3] dark:text-blue-400 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="text-slate-800 dark:text-slate-200 dark:bg-slate-900">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Triwulan Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="filter-triwulan-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">Periode:</label>
              <select
                id="filter-triwulan-select"
                aria-label="Filter Periode Triwulan"
                value={filterTriwulan}
                onChange={(e) => setFilterTriwulan(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#175CD3] dark:text-blue-400 focus:outline-hidden cursor-pointer"
              >
                {PERIODE_TRIWULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-slate-800 dark:text-slate-200 dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || filterTriwulan) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setFilterTriwulan('')
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Reset filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Segmented Navigation Pills (5 Tab SSOT) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto clean-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#175CD3] text-white shadow-2xs'
                    : 'bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* AREA 4: UNIFIED DATA CARD CONTAINER (Table / Tree) */}
      {activeTab === 'tree' ? (
        <IkkHierarchyTreeView filterTahun={filterTahun} filterTriwulan={filterTriwulan} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs overflow-hidden">
          {tableError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{tableError}</span>
              </div>
              <button
                type="button"
                onClick={loadTableData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 text-rose-700 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {/* TAB 1: TRANSAKSI */}
                  {activeTab === 'transaksi' && (
                    <>
                      <th className="px-4 py-3.5 min-w-[320px]">PELAKSANA & URAIAN KEGIATAN</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-44">TIM PENGAMPU</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-44">STATUS & CAPAIAN</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-36">TARGET & REALISASI</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-32">TANGGAL</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-20 text-center">EVIDEN</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-24 text-right">AKSI</th>
                    </>
                  )}

                  {/* TAB 2: SASARAN */}
                  {activeTab === 'sasaran' && (
                    <>
                      <th className="px-4 py-3.5 w-16 text-center">NO URUT</th>
                      <th className="px-4 py-3.5 min-w-[420px]">RUMUSAN SASARAN STRATEGIS</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-44">JUMLAH INDIKATOR</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-36">TANGGAL</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right w-24">AKSI</th>
                    </>
                  )}

                  {/* TAB 3: INDIKATOR */}
                  {activeTab === 'indikator' && (
                    <>
                      <th className="px-4 py-3.5 w-14 text-center">NO</th>
                      <th className="px-4 py-3.5 min-w-[360px]">INDIKATOR KINERJA & SASARAN INDUK</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-36">TARGET RENSTRA</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-44">TIM PENGAMPU</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-40">REALISASI & CAPAIAN</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right w-24">AKSI</th>
                    </>
                  )}

                  {/* TAB 4: KEGIATAN */}
                  {activeTab === 'kegiatan' && (
                    <>
                      <th className="px-4 py-3.5 w-14 text-center">NO</th>
                      <th className="px-4 py-3.5 min-w-[360px]">KEGIATAN OPERASIONAL</th>
                      <th className="px-4 py-3.5 min-w-[280px]">INDIKATOR INDUK</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-44">TIM PENGAMPU</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-32">TARGET VOLUME</th>
                      <th className="px-4 py-3.5 whitespace-nowrap w-24 text-center">STATUS</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right w-24">AKSI</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {isTableLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2.5 w-1/4 bg-slate-100 dark:bg-slate-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-normal">
                      <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada data {activeTab} ditemukan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {debouncedSearch
                          ? 'Tidak ada data yang cocok dengan kriteria pencarian.'
                          : `Belum ada data ${activeTab} untuk periode ini. Silakan input data baru.`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((item, idx) => {
                    const rowNo = (page - 1) * pageSize + idx + 1

                    // TAB 1: TRANSAKSI ROW
                    if (activeTab === 'transaksi') {
                      const target = Number(item.target_mingguan ?? item.target ?? 0)
                      const realisasi = Number(item.jumlah_realisasi ?? item.realisasi ?? 0)
                      const rawPct =
                        item.progres_realisasi !== undefined && item.progres_realisasi !== null
                          ? Number(item.progres_realisasi)
                          : target > 0
                            ? (realisasi / target) * 100
                            : 0
                      const pct = Math.round(rawPct * 10) / 10
                      const isOver = pct > 100
                      const isAchieved = pct >= 100 || (target > 0 && realisasi >= target)
                      const titleText = item.pelaksana_kegiatan_harian || item.nama_kegiatan || item.uraian || '-'
                      const subText = item.nama_kegiatan || item.nama_indikator || '-'
                      const pengampuText = item.pengampu_list || '-'
                      const evidenUrl = item.bukti_pekerjaan || ''

                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 min-w-[320px]">
                            <div className="flex items-center gap-3">
                              <TuDataOriginIcon isExcel={isExcelOrigin(item, true)} />
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItem(item)
                                    setIsDetailModalOpen(true)
                                  }}
                                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block leading-snug cursor-pointer"
                                  title={titleText}
                                >
                                  {titleText}
                                </button>
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
                                  {subText}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{pengampuText}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isOver
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : isAchieved
                                      ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                {isOver ? 'Melampaui' : isAchieved ? 'Tercapai' : 'On-Track'}
                              </span>
                              <span className="text-[#175CD3] dark:text-blue-400 font-mono">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver ? 'bg-emerald-500' : isAchieved ? 'bg-[#175CD3]' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                              {realisasi} {item.satuan_kegiatan || ''}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold font-mono mt-0.5">
                              Target: {target} {item.satuan_kegiatan || ''}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <TuTanggalCell value={item.period_start_date || item.created_at} />
                          </td>

                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {evidenUrl ? (
                              <a
                                href={evidenUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#175CD3] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              >
                                <span>Lihat</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsDetailModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsTransaksiModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Data"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    // TAB 2: SASARAN ROW
                    if (activeTab === 'sasaran') {
                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {item.no_urut || rowNo}
                          </td>
                          <td className="px-4 py-3.5 min-w-[420px]">
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                              {item.nama_sasaran}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#175CD3] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
                              <Layers className="w-3 h-3" />
                              <span>{item.total_indikator || 0} Indikator</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <TuTanggalCell value={item.created_at} />
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsSasaranModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Sasaran"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Sasaran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    // TAB 3: INDIKATOR ROW
                    if (activeTab === 'indikator') {
                      const indPct = Math.round(Number(item.periode_progres || 0) * 10) / 10
                      const isOver = indPct > 100

                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {item.no_urut || rowNo}
                          </td>
                          <td className="px-4 py-3.5 min-w-[360px]">
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                              {item.nama_indikator}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                              Sasaran: {item.nama_sasaran || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.target_volume || '-'} {item.satuan || ''}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px] block">
                              {item.pengampu_list || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isOver
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : indPct >= 100
                                      ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                {isOver ? `Melampaui (${indPct}%)` : `${indPct}%`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsIndikatorModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Indikator"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Indikator"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    // TAB 4: KEGIATAN ROW
                    if (activeTab === 'kegiatan') {
                      const hasPengampu = item.total_pengampu > 0 || item.pengampu_list
                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {item.no_urut || rowNo}
                          </td>
                          <td className="px-4 py-3.5 min-w-[360px]">
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                              {item.nama_kegiatan}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 min-w-[280px]">
                            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                              {item.nama_indikator}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{item.pengampu_list || '-'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.target_volume || '-'} {item.satuan || ''}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                hasPengampu
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
                              }`}
                            >
                              {hasPengampu ? 'Tercakup' : 'Belum Ada'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsKegiatanModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Kegiatan"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Kegiatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return null
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <ServiceTablePagination
              page={page}
              pageSize={pageSize}
              totalRecords={totalRecords}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setPage(1)
              }}
              unitLabel="entri"
            />
          </div>
        </div>
      )}

      {/* MODAL 1: Transaksi Modal (using SearchableSelect) */}
      <IkkTransaksiModal
        isOpen={isTransaksiModalOpen}
        onClose={() => {
          setIsTransaksiModalOpen(false)
          setSelectedItem(null)
        }}
        onSuccess={() => {
          loadSummary()
          loadTableData()
        }}
        initialData={selectedItem}
      />

      {/* MODAL 2: Sasaran Modal */}
      <IkkSasaranModal
        isOpen={isSasaranModalOpen}
        onClose={() => {
          setIsSasaranModalOpen(false)
          setSelectedItem(null)
        }}
        onSuccess={() => {
          loadSummary()
          loadTableData()
        }}
        initialData={selectedItem}
      />

      {/* MODAL 3: Indikator Modal */}
      <IkkIndikatorModal
        isOpen={isIndikatorModalOpen}
        onClose={() => {
          setIsIndikatorModalOpen(false)
          setSelectedItem(null)
        }}
        onSuccess={() => {
          loadSummary()
          loadTableData()
        }}
        initialData={selectedItem}
      />

      {/* MODAL 4: Kegiatan Modal */}
      <IkkKegiatanModal
        isOpen={isKegiatanModalOpen}
        onClose={() => {
          setIsKegiatanModalOpen(false)
          setSelectedItem(null)
        }}
        onSuccess={() => {
          loadSummary()
          loadTableData()
        }}
        initialData={selectedItem}
      />

      {/* MODAL 5: Detail Transaksi Modal */}
      <IkkDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedItem(null)
        }}
        data={selectedItem}
      />

      {/* MODAL 6: Batch Upload Modal */}
      <TuBatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          loadSummary()
          loadTableData()
        }}
        serviceTitle="Manajemen Capaian IKK"
        templateUrl="/templates/tu/template-ikk.xlsx"
        templateName="template-transaksi-ikk.xlsx"
        uploadFn={storeIkkTransaksiBatch}
      />

      {/* MODAL 7: Delete Confirmation Dialog */}
      <TuDeleteConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={`Konfirmasi Hapus ${
          activeTab === 'transaksi'
            ? 'Transaksi IKK'
            : activeTab === 'sasaran'
              ? 'Sasaran Strategis'
              : activeTab === 'indikator'
                ? 'Indikator Kinerja'
                : 'Kegiatan Operasional'
        }`}
        message="Apakah Anda yakin ingin menghapus data ini? Seluruh data keterkaitan berjenjang di bawahnya dapat terpengaruh."
      />
    </div>
  )
}
