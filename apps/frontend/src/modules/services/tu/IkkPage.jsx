import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Target,
  Layers,
  TrendingUp,
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Clock,
  Briefcase,
  Download,
} from 'lucide-react'
import { ServiceHeader } from '../../../components/shared/services/ServiceHeader'
import { KpiCardGrid } from '../../../components/shared/services/KpiCard'
import { IkkGroupedTable } from './components/IkkGroupedTable'
import { IkkDashboardUploadModal } from './components/IkkDashboardUploadModal'
import { IkkRealizationModal } from './components/IkkRealizationModal'
import { IkkLogHistoryModal } from './components/IkkLogHistoryModal'
import {
  fetchIkkGroupedMatrix,
  fetchIkkOptionsTahun,
} from '../../../services/api/tuServicesApi'

const PERIODE_TRIWULAN_OPTIONS = [
  { value: '', label: 'Semua Triwulan (Snapshot Terakhir)' },
  { value: '1', label: 'Triwulan I (Januari - Maret)' },
  { value: '2', label: 'Triwulan II / Semester I (Januari - Juni)' },
  { value: '3', label: 'Triwulan III (Januari - September)' },
  { value: '4', label: 'Triwulan IV / Tahunan (Januari - Desember)' },
]

const BULAN_OPTIONS = [
  { value: '', label: 'Semua Bulan (Snapshot Terkini)' },
  { value: '1', label: 'Bulan 1 (Januari)' },
  { value: '2', label: 'Bulan 2 (Februari)' },
  { value: '3', label: 'Bulan 3 (Maret)' },
  { value: '4', label: 'Bulan 4 (April)' },
  { value: '5', label: 'Bulan 5 (Mei)' },
  { value: '6', label: 'Bulan 6 (Juni)' },
  { value: '7', label: 'Bulan 7 (Juli)' },
  { value: '8', label: 'Bulan 8 (Agustus)' },
  { value: '9', label: 'Bulan 9 (September)' },
  { value: '10', label: 'Bulan 10 (Oktober)' },
  { value: '11', label: 'Bulan 11 (November)' },
  { value: '12', label: 'Bulan 12 (Desember)' },
]

export default function IkkPage() {
  const currentYear = new Date().getFullYear().toString()

  // 1. Filter State
  const [filterTahun, setFilterTahun] = useState(currentYear)
  const [filterBulan, setFilterBulan] = useState('') // Default '' untuk melihat data snapshot terakhir
  const [filterTriwulan, setFilterTriwulan] = useState('') // Default '' untuk snapshot terakhir
  const [availableYears, setAvailableYears] = useState([currentYear, '2025', '2024'])
  const [searchTerm, setSearchTerm] = useState('')

  // 2. Data State
  const [matrixData, setMatrixData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // 3. Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isRealizationModalOpen, setIsRealizationModalOpen] = useState(false)
  const [selectedIndikator, setSelectedIndikator] = useState(null)
  const [activeLogIndikatorId, setActiveLogIndikatorId] = useState(null)

  // Load available years
  useEffect(() => {
    let mounted = true
    fetchIkkOptionsTahun()
      .then((years) => {
        if (!mounted || !Array.isArray(years) || years.length === 0) return
        const normalized = years.map((y) =>
          typeof y === 'object' ? String(y.id || y.tahun || y.value) : String(y)
        )
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

  // Load Grouped Matrix Data (Sasaran -> Indikator with latest non-accumulated snapshot)
  const loadMatrix = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const data = await fetchIkkGroupedMatrix({
        tahun: filterTahun,
        bulan: filterBulan,
        triwulan: filterTriwulan,
      })
      setMatrixData(data)
    } catch (err) {
      console.warn('Gagal memuat matriks IKK:', err)
      setMatrixData(null)
      setErrorMessage(err?.message || 'Gagal memuat matriks capaian IKK dari server.')
    } finally {
      setIsLoading(false)
    }
  }, [filterTahun, filterBulan, filterTriwulan])

  useEffect(() => {
    loadMatrix()
  }, [loadMatrix])

  const handleReload = () => {
    loadMatrix()
  }

  // Handle Edit Satuan
  const handleEditItem = (indikator) => {
    setSelectedIndikator(indikator)
    setIsRealizationModalOpen(true)
  }

  // Handle Tambah Input Satuan (pilih indikator pertama sebagai default jika belum dipilih)
  const handleAddSatuanClick = () => {
    const firstInd = matrixData?.sasarans?.[0]?.indikators?.[0] || null
    setSelectedIndikator(firstInd)
    setIsRealizationModalOpen(true)
  }

  // 4 Bento KPI Cards
  const kpiItems = useMemo(() => {
    const totalSasaran = matrixData?.total_sasaran ?? 7
    const totalIndikator = matrixData?.total_indikator ?? 18
    const totalTerisi = matrixData?.total_terisi ?? 0
    const avgCapaian = matrixData?.avg_capaian ?? 0

    return [
      {
        id: 'total_sasaran',
        label: 'SASARAN STRATEGIS',
        value: totalSasaran,
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
        value: totalIndikator,
        unit: 'IKK',
        context: 'Mencakup seluruh Tim Kerja',
        badge: 'IKK Kanreg',
        badgeColor: 'indigo',
        icon: Layers,
        iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      },
      {
        id: 'rata_capaian',
        label: 'RATA-RATA CAPAIAN IKK',
        value: `${avgCapaian}%`,
        unit: '',
        isText: true,
        context: filterTriwulan
          ? PERIODE_TRIWULAN_OPTIONS.find((p) => p.value === filterTriwulan)?.label || 'Periode Triwulan'
          : 'Snapshot Terakhir',
        badge: avgCapaian >= 100 ? 'Sangat Baik' : avgCapaian >= 80 ? 'Baik' : 'Perlu Perhatian',
        badgeColor: avgCapaian >= 100 ? 'emerald' : avgCapaian >= 80 ? 'blue' : 'amber',
        icon: TrendingUp,
        iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      },
      {
        id: 'status_terisi',
        label: 'KELENGKAPAN CAPAIAN',
        value: `${totalTerisi} / ${totalIndikator}`,
        unit: 'Indikator',
        context: `${totalIndikator - totalTerisi} indikator belum terisi`,
        badge: totalTerisi === totalIndikator ? '100% Lengkap' : 'On-Progress',
        badgeColor: totalTerisi === totalIndikator ? 'emerald' : 'blue',
        icon: CheckCircle2,
        iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      },
    ]
  }, [matrixData, filterTriwulan])

  return (
    <div className="space-y-4">
      {/* AREA 1: SERVICE HEADER */}
      <ServiceHeader
        serviceTitle="Manajemen Capaian IKK"
        description="Monitoring capaian kinerja Indikator Kinerja Kegiatan (IKK) berbasis Sasaran Strategis Renstra Kanreg III BKN. Menyajikan data posisi terakhir terpadu."
        timKerjaTitle="Bagian Tata Usaha"
        badgeColor="emerald"
        onReloadClick={handleReload}
        isReloading={isLoading}
        onUploadClick={() => setIsUploadModalOpen(true)}
        uploadLabel="Upload Excel"
        onAddEntryClick={handleAddSatuanClick}
        addEntryLabel="Input Satuan"
      />

      {/* AREA 2: 4 BENTO KPI CARDS */}
      <KpiCardGrid kpis={kpiItems} isLoading={isLoading} borderless />

      {/* AREA 3: FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor IKK, nama indikator, sasaran strategis, atau kendala..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Filter Periode (Tahun, Bulan, & Triwulan) + Tombol Unduh Template */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Dropdown Tahun */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tahun:</span>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Bulan */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bulan:</span>
              <select
                value={filterBulan}
                onChange={(e) => {
                  const val = e.target.value
                  setFilterBulan(val)
                  if (val) {
                    setFilterTriwulan(String(Math.ceil(Number(val) / 3)))
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Periode Triwulan */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Triwulan:</span>
              <select
                value={filterTriwulan}
                onChange={(e) => setFilterTriwulan(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
              >
                {PERIODE_TRIWULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Unduh Template Excel Siap Pakai */}
            <a
              href="/templates/tu/template-realisasi-ikk.xlsx"
              download="Template_Realisasi_IKK.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
              title="Unduh Format Template Excel Realisasi IKK Siap Pakai"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Template Excel</span>
            </a>
          </div>
        </div>
      </div>

      {/* AREA 4: UNIFIED GROUPED COLLAPSIBLE TABLE */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      <IkkGroupedTable
        sasarans={matrixData?.sasarans || []}
        isLoading={isLoading}
        searchTerm={searchTerm}
        filterTahun={filterTahun}
        filterBulan={filterBulan}
        filterTriwulan={filterTriwulan}
        onEditItem={handleEditItem}
        onViewLogs={(ind) => setActiveLogIndikatorId(ind.id)}
      />

      {/* MODAL 1: EXCEL DASHBOARD UPLOAD (PRIORITAS UTAMA) */}
      <IkkDashboardUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadMatrix}
        defaultTahun={filterTahun}
        defaultBulan={filterBulan || '9'}
        defaultTriwulan={filterTriwulan || '3'}
      />

      {/* MODAL 2: INPUT / EDIT SATUAN REALISASI IKK */}
      <IkkRealizationModal
        isOpen={isRealizationModalOpen}
        onClose={() => {
          setIsRealizationModalOpen(false)
          setSelectedIndikator(null)
        }}
        onSuccess={loadMatrix}
        item={selectedIndikator}
        currentTahun={filterTahun}
        currentBulan={filterBulan || '9'}
        currentTriwulan={filterTriwulan || '3'}
      />

      {/* MODAL 3: VIEW RIWAYAT LOG HISTORI IKK */}
      <IkkLogHistoryModal
        isOpen={!!activeLogIndikatorId}
        indikatorId={activeLogIndikatorId}
        onClose={() => setActiveLogIndikatorId(null)}
        onLogDeleted={loadMatrix}
        onEditLog={(item) => {
          setSelectedIndikator(item)
          setIsRealizationModalOpen(true)
        }}
      />
    </div>
  )
}
