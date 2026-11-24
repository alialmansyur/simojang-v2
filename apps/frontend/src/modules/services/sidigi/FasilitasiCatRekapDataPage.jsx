import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Users,
  User,
  AlertCircle,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  UploadCloud,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  UserCheck,
  Target,
  ArrowLeft,
  RotateCcw,
  Calendar,
  Building2,
  Layers,
  MapPin,
  Clock,
  ChevronUp,
  BarChart3,
} from 'lucide-react'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { KpiCardGrid } from '../../../components/shared/services/KpiCard'
import {
  fetchCatSessions,
  fetchCatSessionSummary,
  saveCatSessionMultiRow,
  deleteCatSession,
  importCatBatchExcel,
} from '../../../services/api/sidigiCatServicesApi'
import { CatJenisTesSelectorSection } from '../../../components/shared/services/sidigi/cat/CatJenisTesSelectorSection'
import { CatFilterParameterSection } from '../../../components/shared/services/sidigi/cat/CatFilterParameterSection'
import { useCatFilterWorkflow } from '../../../components/shared/services/sidigi/cat/useCatFilterWorkflow'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { exportToXlsx } from '../../../utils/exportXlsxTable'
import { SidigiDeleteConfirmDialog } from '../../../components/shared/services/sidigi/SidigiDeleteConfirmDialog'
import { CatSessionFormModal } from '../../../components/shared/services/sidigi/cat/CatSessionFormModal'
import { CatBatchUploadModal } from '../../../components/shared/services/sidigi/cat/CatBatchUploadModal'
import { CatSessionDetailModal } from '../../../components/shared/services/sidigi/cat/CatSessionDetailModal'
import { CatSessionEditModal } from '../../../components/shared/services/sidigi/cat/CatSessionEditModal'
import {
  encodeCatJenisToken,
  encodeCatFilterToken,
  setActiveCatJenisToken,
  setActiveCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'

export default function FasilitasiCatRekapDataPage() {
  const navigate = useNavigate()

  // Table Sessions State in Level 2
  const [sessions, setSessions] = useState([])
  const [sessionSummary, setSessionSummary] = useState(null)
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Show / Hide Bento KPI Cards with LocalStorage Persistence
  const [showKpi, setShowKpi] = useState(() => {
    try {
      const saved = localStorage.getItem('cat_rekap_show_kpi')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })

  const toggleShowKpi = () => {
    setShowKpi((prev) => {
      const next = !prev
      try {
        localStorage.setItem('cat_rekap_show_kpi', String(next))
      } catch (err) {
        console.warn('Failed saving showKpi preference to localStorage:', err)
      }
      return next
    })
  }

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isExternalAddInstansiOpen, setIsExternalAddInstansiOpen] = useState(false)

  // View / Edit / Delete Modals
  const [viewingSession, setViewingSession] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [deletingSession, setDeletingSession] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format Helpers
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))
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

  // Execute Query when filter submitted or date filters change
  const executeQuery = useCallback(async (filters) => {
    if (!filters?.tilokUid) return

    try {
      setIsSessionsLoading(true)
      const [resSessions, resSummary] = await Promise.all([
        fetchCatSessions({
          tilokUid: filters.tilokUid,
          seleksiId: filters.seleksiId || '',
          tgl_mulai: filters.tglMulai || '',
          tgl_selesai: filters.tglSelesai || '',
          start: 0,
          length: 1000,
          search: '',
        }),
        fetchCatSessionSummary({
          tilokUid: filters.tilokUid,
          seleksiId: filters.seleksiId || '',
          tglMulai: filters.tglMulai || '',
          tglSelesai: filters.tglSelesai || '',
        }),
      ])

      const rawSessions = Array.isArray(resSessions.data) ? resSessions.data : []
      // Urutkan tanggal terbaru (period_date DESC) dan nomor sesi terbesar (sesi DESC)
      const sortedSessions = [...rawSessions].sort((a, b) => {
        const dateA = a.period_date ? new Date(a.period_date).getTime() : 0
        const dateB = b.period_date ? new Date(b.period_date).getTime() : 0
        if (dateA !== dateB) return dateB - dateA

        const sesiA = Number(a.sesi || 0)
        const sesiB = Number(b.sesi || 0)
        if (sesiA !== sesiB) return sesiB - sesiA

        const parseCreated = (v) => {
          if (!v || v === '-') return 0
          const ts = new Date(String(v).replace(' ', 'T')).getTime()
          return Number.isNaN(ts) ? 0 : ts
        }
        const createdA = parseCreated(a.created_at)
        const createdB = parseCreated(b.created_at)
        if (createdA !== createdB) return createdB - createdA

        return (Number(b.id) || 0) - (Number(a.id) || 0)
      })

      setSessions(sortedSessions)
      setSessionSummary(resSummary)
      setPage(1)
    } catch (err) {
      console.warn('Failed loading sessions table:', err)
      setSessions([])
      setSessionSummary(null)
    } finally {
      setIsSessionsLoading(false)
    }
  }, [])

  const clearTableData = useCallback(() => {
    setSessions([])
    setSessionSummary(null)
    setPage(1)
    setTableSearch('')
  }, [])

  const {
    jenisToken,
    jenisPeriodeList,
    selectedYear,
    setSelectedYear,
    isJenisLoading,
    loadJenisPeriode,
    activeJenisTes,
    seleksiList,
    isSeleksiLoading,
    isTilokLoading,
    instansiList,
    isInstansiLoading,
    seleksiOptions,
    tilokOptions,
    currentSelectedKegiatan,
    currentSelectedTilok,
    filterSeleksiId,
    filterTilokUid,
    filterInstansiIds,
    setFilterInstansiIds,
    filterTglMulai,
    setFilterTglMulai,
    filterTglSelesai,
    setFilterTglSelesai,
    hasSubmitted,
    appliedFilters,
    setAppliedFilters,
    loadKegiatanForActiveJenis,
    loadTiloksForKegiatan,
    loadInstansiForTilokAndKegiatan,
    handleSelectJenisTesCard,
    handleBackToLevel1,
    handleKegiatanChange,
    handleTilokChange,
    applyFilters,
    handleSearchSubmit,
    handleResetFilter,
  } = useCatFilterWorkflow({
    basePath: '/layanan/fasilitasi-cat/rekap-data',
    onExecuteQuery: executeQuery,
    onClearData: clearTableData,
    clearSubmittedOnCascadeChange: false,
  })

  // Date range filter apply
  const handleApplyDateRange = () => {
    if (!hasSubmitted || !appliedFilters) return
    setPage(1)
    applyFilters({
      ...appliedFilters,
      tglMulai: filterTglMulai,
      tglSelesai: filterTglSelesai,
    })
  }

  // Date range filter reset
  const handleResetDateRange = () => {
    setFilterTglMulai('')
    setFilterTglSelesai('')
    if (hasSubmitted && appliedFilters) {
      setPage(1)
      applyFilters({
        ...appliedFilters,
        tglMulai: '',
        tglSelesai: '',
      })
    }
  }

  // Multi-Instansi Filtering & Pagination Logic
  const displaySessions = useMemo(() => {
    if (!appliedFilters?.instansiIds || appliedFilters.instansiIds.length === 0) {
      return sessions
    }
    if (instansiList.length > 0 && appliedFilters.instansiIds.length === instansiList.length) {
      return sessions
    }
    const set = new Set(appliedFilters.instansiIds.map(String))
    return sessions.filter((s) => {
      const id = String(s.instansi_id || '')
      const kode = String(s.instansi_kodeins || '')
      return set.has(id) || set.has(kode)
    })
  }, [sessions, appliedFilters?.instansiIds, instansiList.length])

  const filteredSessions = useMemo(() => {
    if (!tableSearch) return displaySessions
    const q = tableSearch.toLowerCase()
    return displaySessions.filter((s) => {
      const matchInstansi = (s.instansi_nama || '').toLowerCase().includes(q)
      const matchSesi = String(s.sesi || '').includes(q)
      const matchDate = (s.period_date || '').toLowerCase().includes(q)
      const matchTilok = (s.tilok_nama || '').toLowerCase().includes(q)
      const matchUser = (s.created_by || '').toLowerCase().includes(q)
      return matchInstansi || matchSesi || matchDate || matchTilok || matchUser
    })
  }, [displaySessions, tableSearch])

  const paginatedSessions = useMemo(() => {
    const startIdx = (page - 1) * pageSize
    return filteredSessions.slice(startIdx, startIdx + pageSize)
  }, [filteredSessions, page, pageSize])

  const displaySummary = useMemo(() => {
    let hadir = 0
    let tidakHadir = 0
    let alokasi = 0
    let skorMin = Infinity
    let skorMax = -Infinity
    let hasSkor = false

    displaySessions.forEach((s) => {
      const h = Number(s.hadir || 0)
      const th = Number(s.tidak_hadir || 0)
      const k = Number(s.kuota || 0) || h + th
      hadir += h
      tidakHadir += th
      alokasi += k

      const nMin = parseFloat(s.nilai_min)
      const nMax = parseFloat(s.nilai_max)
      if (!isNaN(nMin) && s.nilai_min !== '-' && nMin > 0) {
        skorMin = Math.min(skorMin, nMin)
        hasSkor = true
      }
      if (!isNaN(nMax) && s.nilai_max !== '-' && nMax > 0) {
        skorMax = Math.max(skorMax, nMax)
        hasSkor = true
      }
    })

    return {
      total_sesi: displaySessions.length,
      total_hadir: hadir,
      total_tidak_hadir: tidakHadir,
      total_peserta: alokasi,
      skor_min: hasSkor && skorMin !== Infinity ? skorMin : (sessionSummary?.skor_min || '-'),
      skor_max: hasSkor && skorMax !== -Infinity ? skorMax : (sessionSummary?.skor_max || '-'),
    }
  }, [displaySessions, sessionSummary])

  // Export Table Sessions to Native Excel (.xlsx)
  const handleExportExcel = () => {
    if (!displaySessions || displaySessions.length === 0) {
      toast.warning('Tidak ada data sesi untuk diekspor.')
      return
    }

    const tilokName = currentSelectedTilok?.nama_tilok || 'Semua Tilok'
    const kegiatanName = currentSelectedKegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'Rekap CAT'

    const exportData = displaySessions.map((r, idx) => {
      const totalPeserta = Number(r.kuota || 0) || Number(r.hadir || 0) + Number(r.tidak_hadir || 0)
      return {
        No: idx + 1,
        'Instansi Peserta': r.instansi_nama || `Instansi ${r.instansi_id}`,
        'Kode Instansi': r.instansi_kodeins || r.instansi_id || '-',
        'Kegiatan Seleksi': r.nama_seleksi || kegiatanName,
        'Titik Lokasi': tilokName,
        Tanggal: r.period_date || '-',
        Sesi: Number(r.sesi || 1),
        'Alokasi Kuota': totalPeserta,
        Hadir: Number(r.hadir || 0),
        'Tidak Hadir': Number(r.tidak_hadir || 0),
        Reschedule: Number(r.reschedule || 0),
        'Nilai Min': r.nilai_min !== '-' && r.nilai_min !== undefined ? Number(r.nilai_min) || r.nilai_min : '-',
        'Nilai Max': r.nilai_max !== '-' && r.nilai_max !== undefined ? Number(r.nilai_max) || r.nilai_max : '-',
        'Memenuhi (MS)': Number(r.memenuhi || 0),
        'Tidak Memenuhi (TMS)': Number(r.tidak_memenuhi || 0),
        Pencatat: r.created_by || '-',
        'Waktu Input': r.created_at || '-',
      }
    })

    const sanitizeName = (kegiatanName || 'rekap_cat').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    exportToXlsx({
      filename: `rekap_sesi_cat_${sanitizeName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Rekap Sesi CAT',
      data: exportData,
    })
  }

  // Delete session handler
  const handleDeleteSessionConfirm = async () => {
    if (!deletingSession) return
    try {
      setIsDeleting(true)
      await deleteCatSession(deletingSession.id)
      setDeletingSession(null)
      toast.success('Sesi ujian berhasil dihapus.')
      if (appliedFilters) {
        executeQuery(appliedFilters)
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus sesi ujian.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SERVICE HEADER (STANDARISASI_UI_UX_MASTER_SSOT.md & /layanan/fasilitasi-cat/laporan) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Rekap Data Sesi Fasilitasi CAT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Kelola dan pantau realisasi pelaksanaan sesi CAT di seluruh titik lokasi.
          </p>

          {activeJenisTes && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                <span>{activeJenisTes.display_nama || activeJenisTes.jenis_tes_nama}</span>
                <span className="text-slate-400 font-semibold">({activeJenisTes.periode})</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (Right) - Samakan persis dengan /layanan/fasilitasi-cat/laporan */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              if (activeJenisTes) {
                handleBackToLevel1()
              } else {
                navigate('/layanan/fasilitasi-cat')
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title={activeJenisTes ? 'Kembali ke Daftar Jenis Tes' : 'Kembali ke Portal CAT'}
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeJenisTes && appliedFilters) {
                executeQuery(appliedFilters)
              } else if (activeJenisTes) {
                loadKegiatanForActiveJenis(activeJenisTes)
              } else {
                loadJenisPeriode()
              }
            }}
            disabled={isJenisLoading || isSessionsLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isJenisLoading || isSessionsLoading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {activeJenisTes && filterTilokUid && (
            <button
              type="button"
              onClick={() => {
                const jToken = jenisToken || encodeCatJenisToken(activeJenisTes)
                const fToken = encodeCatFilterToken({
                  seleksiId: filterSeleksiId,
                  tilokUid: filterTilokUid,
                  instansiIds: filterInstansiIds,
                  tglMulai: filterTglMulai,
                  tglSelesai: filterTglSelesai,
                })
                setActiveCatJenisToken(jToken)
                if (fToken) setActiveCatFilterToken(jToken, fToken)
                navigate(buildCatModuleUrl('/layanan/fasilitasi-cat/laporan', jToken, fToken))
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#175CD3] dark:text-blue-300 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Buka Pembuat Dokumen Laporan CAT dengan parameter saat ini"
            >
              <FileText className="w-4 h-4 text-[#175CD3] dark:text-blue-400" />
              <span>Buat Laporan</span>
            </button>
          )}

          {activeJenisTes && hasSubmitted && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isSessionsLoading || displaySessions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ekspor Data Sesi ke Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* LEVEL 1: GRID JENIS TES BESAR CAT (SHARED COMPONENT) */}
      {!activeJenisTes && (
        <CatJenisTesSelectorSection
          jenisPeriodeList={jenisPeriodeList}
          isLoading={isJenisLoading}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onSelectJenisTes={handleSelectJenisTesCard}
          onReloadList={loadJenisPeriode}
        />
      )}

      {/* LEVEL 2: CASCADING FILTER WAJIB + GATED CONTENT */}
      {activeJenisTes && (
        <div className="space-y-5">
          {/* PANEL FILTER PARAMETER PELAKSANAAN TERPADU (SHARED) */}
          <CatFilterParameterSection
            activeJenisTes={activeJenisTes}
            seleksiOptions={seleksiOptions}
            tilokOptions={tilokOptions}
            instansiList={instansiList}
            isSeleksiLoading={isSeleksiLoading}
            isTilokLoading={isTilokLoading}
            isInstansiLoading={isInstansiLoading}
            filterSeleksiId={filterSeleksiId}
            filterTilokUid={filterTilokUid}
            filterInstansiIds={filterInstansiIds}
            onKegiatanChange={handleKegiatanChange}
            onTilokChange={handleTilokChange}
            onInstansiChange={setFilterInstansiIds}
            currentSelectedTilok={currentSelectedTilok}
            onReloadKegiatan={() => activeJenisTes && loadKegiatanForActiveJenis(activeJenisTes)}
            onReloadTilok={() =>
              filterSeleksiId && activeJenisTes && loadTiloksForKegiatan(filterSeleksiId, activeJenisTes)
            }
            onReloadInstansi={async () => {
              if (filterTilokUid) {
                await loadInstansiForTilokAndKegiatan(filterTilokUid, filterSeleksiId, { preserveSelection: true })
              }
            }}
            onSubmit={(e) => handleSearchSubmit(e, { includeDateRange: true })}
            onResetFilter={handleResetFilter}
            isSubmitting={isSessionsLoading}
            submitLabel="Cari Data"
            submitTitle="Cari Data Rekap Sesi"
            externalAddInstansiOpen={isExternalAddInstansiOpen}
            onCloseExternalAddInstansi={() => setIsExternalAddInstansiOpen(false)}
          />

          {/* GATING: EMPTY STATE PROMPT SEBELUM FILTER DI-SUBMIT */}
          {!hasSubmitted ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Filter Data Sesi Belum Diterapkan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Silakan pilih <strong>Kegiatan Seleksi</strong> dan <strong>Titik Lokasi (Tilok)</strong> pada panel filter di atas, kemudian klik tombol{' '}
                  <strong className="text-[#175CD3] dark:text-blue-400 font-semibold">"Cari Data"</strong> untuk memuat rekapitulasi kehadiran dan tabel sesi ujian CAT.
                </p>
              </div>
            </div>
          ) : (
            /* KETIKA SUDAH DISUBMIT: TAMPILKAN 4 BENTO KPI CARDS + SUB-TOOLBAR + TABEL */
            <div className="space-y-4">
              {/* 4 BENTO KPI CARDS (STANDAR MANAJEMEN TALENTA & SSOT) */}
              {showKpi && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <KpiCardGrid
                    borderless
                    isLoading={isSessionsLoading}
                    kpis={[
                      {
                        id: 'total_sesi',
                        label: 'TOTAL SESI UJIAN',
                        value: displaySummary?.total_sesi ?? displaySessions.length,
                        unit: 'Sesi',
                        context: currentSelectedTilok?.nama_tilok || 'Realisasi sesi',
                        badge: 'Realisasi',
                        badgeColor: 'blue',
                        icon: Calendar,
                        iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
                      },
                      {
                        id: 'total_hadir',
                        label: 'TOTAL PESERTA HADIR',
                        value: displaySummary?.total_hadir ?? 0,
                        unit: 'Orang',
                        context: 'Total kehadiran terverifikasi',
                        badge: 'Hadir',
                        badgeColor: 'emerald',
                        icon: Users,
                        iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                      },
                      {
                        id: 'total_tidak_hadir',
                        label: 'TIDAK HADIR',
                        value: displaySummary?.total_tidak_hadir ?? 0,
                        unit: 'Orang',
                        context: 'Absen / Tidak datang',
                        badge: 'Evaluasi',
                        badgeColor: 'rose',
                        icon: Users,
                        iconColor: 'bg-rose-50/80 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
                      },
                      {
                        id: 'total_peserta',
                        label: 'TOTAL ALOKASI PESERTA',
                        value: displaySummary?.total_peserta ?? 0,
                        unit: 'Peserta',
                        context: `Skor: ${displaySummary?.skor_min ?? '-'} s/d ${displaySummary?.skor_max ?? '-'}`,
                        badge: 'Alokasi',
                        badgeColor: 'amber',
                        icon: UserCheck,
                        iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                      },
                    ]}
                  />
                </div>
              )}

              {/* ACTION & SUB-TOOLBAR WITH DATE RANGE FILTER */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search & Date Range */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari sesi, peserta, instansi..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full pl-9 pr-3 h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    />
                  </div>

                  {/* Inline Date Range Filter */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={filterTglMulai}
                        onChange={(e) => setFilterTglMulai(e.target.value)}
                        className="px-2.5 h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        title="Tanggal Mulai"
                      />
                      <span className="text-slate-400">s/d</span>
                      <input
                        type="date"
                        value={filterTglSelesai}
                        onChange={(e) => setFilterTglSelesai(e.target.value)}
                        className="px-2.5 h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        title="Tanggal Selesai"
                      />
                    </div>

                    {(filterTglMulai || filterTglSelesai) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleApplyDateRange}
                          className="h-[38px] px-3.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Terapkan
                        </button>
                        <button
                          type="button"
                          onClick={handleResetDateRange}
                          className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Reset filter tanggal"
                        >
                          Reset Tanggal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons (SSOT: Input Data Primer + Upload Data Sekunder + Toggle KPI) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleShowKpi}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title={showKpi ? 'Sembunyikan Ringkasan Metrik KPI' : 'Tampilkan Ringkasan Metrik KPI'}
                  >
                    {showKpi ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                        <span>Sembunyikan KPI</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 text-[#175CD3] dark:text-blue-400" />
                        <span>Tampilkan KPI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Upload Data (Batch Excel)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Upload Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Input Data Sesi"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5] text-white" />
                    <span>Input Data</span>
                  </button>
                </div>
              </div>

              {/* UNIFIED SESSIONS TABLE (PEDOMAN_STANDARISASI_TABLE_MASTER.md) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto clean-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-5">INSTANSI & SESI</th>
                        <th className="py-3.5 px-4 sm:px-5">TANGGAL</th>
                        <th className="py-3.5 px-4 sm:px-5">KEHADIRAN & PRESENSI</th>
                        <th className="py-3.5 px-4 sm:px-5">NILAI MIN / MAX</th>
                        <th className="py-3.5 px-4 sm:px-5">PETUGAS</th>
                        <th className="py-3.5 px-4 sm:px-5 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {isSessionsLoading ? (
                        Array.from({ length: 5 }).map((_, rIdx) => (
                          <tr key={rIdx} className="animate-pulse">
                            {/* INSTANSI & SESI */}
                            <td className="py-4 px-4 sm:px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                                <div className="space-y-1.5">
                                  <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                                  <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                                </div>
                              </div>
                            </td>
                            {/* TANGGAL */}
                            <td className="py-4 px-4 sm:px-5">
                              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            </td>
                            {/* KEHADIRAN & PRESENSI */}
                            <td className="py-4 px-4 sm:px-5">
                              <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            </td>
                            {/* NILAI MIN / MAX */}
                            <td className="py-4 px-4 sm:px-5">
                              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            </td>
                            {/* PIC */}
                            <td className="py-4 px-4 sm:px-5">
                              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                            </td>
                            {/* AKSI */}
                            <td className="py-4 px-4 sm:px-5 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : paginatedSessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600 dark:text-slate-300">
                              Tidak ada data sesi ujian ditemukan
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Belum ada entri sesi untuk kombinasi filter ini. Klik "Input Data" atau "Upload Data".
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedSessions.map((row) => {
                          const hadirNum = Number(row.hadir || 0)
                          const tdkHadirNum = Number(row.tidak_hadir || 0)
                          const totalPeserta = hadirNum + tdkHadirNum > 0 ? hadirNum + tdkHadirNum : Number(row.kuota || hadirNum)
                          const pctHadir = totalPeserta > 0 ? Math.round((hadirNum / totalPeserta) * 100) : 0

                          const skorMin = row.nilai_min !== null && row.nilai_min !== undefined && row.nilai_min !== ''
                            ? row.nilai_min
                            : '-'
                          const skorMax = row.nilai_max !== null && row.nilai_max !== undefined && row.nilai_max !== ''
                            ? row.nilai_max
                            : '-'

                          return (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Kolom 1: INSTANSI & SESI */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <SidigiDataOriginIcon isExcel={isExcelOrigin(row)} />
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setViewingSession(row)}
                                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                                      title={row.instansi_nama}
                                    >
                                      {row.instansi_nama}
                                    </button>
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                      <span className="font-bold text-slate-700 dark:text-slate-300">Sesi {row.sesi}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 2: TANGGAL */}
                              <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                                <SidigiTanggalCell value={row.period_date || row.created_at} />
                              </td>

                              {/* Kolom 3: KEHADIRAN & PRESENSI */}
                              <td className="py-3 px-4 sm:px-5">
                                <div className="flex items-center gap-3 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Hadir</span>
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                      {formatNumber(hadirNum)}
                                    </span>
                                  </div>
                                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Tdk Hadir</span>
                                    <span
                                      className={`font-extrabold ${
                                        tdkHadirNum > 0
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : 'text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      {formatNumber(tdkHadirNum)}
                                    </span>
                                  </div>
                                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Total ({pctHadir}%)</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                      {formatNumber(totalPeserta)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 5: NILAI MIN / MAX */}
                              <td className="py-3 px-4 sm:px-5">
                                <div className="flex items-center gap-3 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Min</span>
                                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                                      {skorMin}
                                    </span>
                                  </div>
                                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Max</span>
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                      {skorMax}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 5: PETUGAS */}
                              <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                                <SidigiPetugasCell value={row.created_by || 'PIC Tilok CAT'} />
                              </td>

                              {/* Kolom 6: AKSI */}
                              <td className="py-3 px-4 sm:px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  {/* Detail / Lihat Rincian Sesi */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingSession(row)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                    title="Lihat Rincian Sesi CAT"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Edit / Ubah Sesi */}
                                  <button
                                    type="button"
                                    onClick={() => setEditingSession(row)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                    title="Ubah Data Sesi"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  {/* Delete / Hapus Sesi */}
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSession(row)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Hapus Sesi"
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

                {/* FOOTER PAGINATION WRAPPED WITH GENEROUS PADDING (SSOT STANDARD) */}
                <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <ServiceTablePagination
                    currentPage={page}
                    totalPages={Math.ceil(filteredSessions.length / pageSize) || 1}
                    totalRecords={filteredSessions.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      <CatSessionDetailModal
        isOpen={Boolean(viewingSession)}
        onClose={() => setViewingSession(null)}
        session={viewingSession}
      />

      {/* EDIT SESSION MODAL */}
      <CatSessionEditModal
        isOpen={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        session={editingSession}
        onSuccess={() => {
          if (appliedFilters) {
            executeQuery(appliedFilters)
          } else if (filterTilokUid) {
            executeQuery({
              tilokUid: filterTilokUid,
              seleksiId: filterSeleksiId,
              tglMulai: filterTglMulai,
              tglSelesai: filterTglSelesai,
              instansiIds: filterInstansiIds,
            })
          }
        }}
      />

      {/* INPUT SESI BARU MODAL */}
      <CatSessionFormModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSuccess={async () => {
          if (filterTilokUid) {
            await loadInstansiForTilokAndKegiatan(filterTilokUid, filterSeleksiId, { preserveSelection: true })
          }
          if (appliedFilters) executeQuery(appliedFilters)
        }}
        tilokUid={currentSelectedTilok ? currentSelectedTilok.uid || currentSelectedTilok.id : appliedFilters?.tilokUid || filterTilokUid}
        tilokNama={currentSelectedTilok ? currentSelectedTilok.nama_tilok : ''}
        defaultInstansiId={appliedFilters?.instansiIds?.[0] || filterInstansiIds[0] || ''}
        instansiList={instansiList}
        defaultSeleksiId={appliedFilters?.seleksiId || filterSeleksiId}
        seleksiList={seleksiList}
        jenisTesId={activeJenisTes ? activeJenisTes.jenis_tes_id || activeJenisTes.id : '1'}
        onSubmitFn={saveCatSessionMultiRow}
        onRequestAddInstansi={() => {
          setIsSessionModalOpen(false)
          setIsExternalAddInstansiOpen(true)
        }}
      />

      {/* UPLOAD BATCH MODAL */}
      <CatBatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={async () => {
          if (filterTilokUid) {
            await loadInstansiForTilokAndKegiatan(filterTilokUid, filterSeleksiId, { preserveSelection: true })
          }
          if (appliedFilters) executeQuery(appliedFilters)
        }}
        tilokUid={currentSelectedTilok ? currentSelectedTilok.uid || currentSelectedTilok.id : appliedFilters?.tilokUid || filterTilokUid}
        tilokNama={currentSelectedTilok ? currentSelectedTilok.nama_tilok : ''}
        seleksiId={appliedFilters?.seleksiId || filterSeleksiId}
        jenisTesId={activeJenisTes ? activeJenisTes.jenis_tes_id || activeJenisTes.id : '1'}
        uploadFn={importCatBatchExcel}
      />

      {/* DELETE CONFIRM DIALOG */}
      <SidigiDeleteConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleDeleteSessionConfirm}
        isDeleting={isDeleting}
        itemTitle={deletingSession ? `Sesi ${deletingSession.sesi} - ${deletingSession.instansi_nama}` : ''}
      />
    </div>
  )
}
