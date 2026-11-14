import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ReactApexChart from 'react-apexcharts'
import {
  Users,
  UserCheck,
  AlertCircle,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Building2,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  Sparkles,
  Info,
  Clock,
  FileText,
} from 'lucide-react'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { KpiCardGrid } from '../../../components/shared/services/KpiCard'
import {
  fetchCatSessions,
  fetchCatSessionSummary,
} from '../../../services/api/sidigiCatServicesApi'
import { CatJenisTesSelectorSection } from '../../../components/shared/services/sidigi/cat/CatJenisTesSelectorSection'
import { CatFilterParameterSection } from '../../../components/shared/services/sidigi/cat/CatFilterParameterSection'
import { useCatFilterWorkflow } from '../../../components/shared/services/sidigi/cat/useCatFilterWorkflow'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { exportToXlsx } from '../../../utils/exportXlsxTable'
import {
  encodeCatJenisToken,
  encodeCatFilterToken,
  setActiveCatJenisToken,
  setActiveCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'

export default function FasilitasiCatRekapitulasiPage() {
  const navigate = useNavigate()

  // --------------------------------------------------------------------------
  // MINI DASHBOARD DATA STATE
  // --------------------------------------------------------------------------
  const [sessions, setSessions] = useState([])
  const [sessionSummary, setSessionSummary] = useState(null)
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  // Table pagination and filtering inside the mini dashboard
  const [tableSearch, setTableSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  // --------------------------------------------------------------------------
  // EXECUTE QUERY: Fetch Full Session Data for Aggregation & Mini Dashboard
  // --------------------------------------------------------------------------
  const executeQuery = useCallback(async (filters) => {
    if (!filters?.tilokUid) return

    try {
      setIsSessionsLoading(true)
      // Fetch up to 1000 sessions for comprehensive analytics and chart generation
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
        }),
      ])

      const rawSessions = Array.isArray(resSessions.data) ? resSessions.data : []
      // Standard SSOT Sorting: Tanggal terbaru DESC, Sesi terbesar DESC, id DESC
      const sortedSessions = [...rawSessions].sort((a, b) => {
        const dateA = a.period_date ? new Date(a.period_date).getTime() : 0
        const dateB = b.period_date ? new Date(b.period_date).getTime() : 0
        if (dateA !== dateB) return dateB - dateA

        const sesiA = Number(a.sesi || 0)
        const sesiB = Number(b.sesi || 0)
        if (sesiA !== sesiB) return sesiB - sesiA

        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0
        if (createdA !== createdB) return createdB - createdA

        return (Number(b.id) || 0) - (Number(a.id) || 0)
      })

      setSessions(sortedSessions)
      setSessionSummary(resSummary)
      setPage(1)
    } catch (err) {
      console.warn('Gagal memuat data rekapitulasi sesi:', err)
      setSessions([])
      setSessionSummary(null)
    } finally {
      setIsSessionsLoading(false)
    }
  }, [])

  const clearDashboardData = useCallback(() => {
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
    basePath: '/layanan/fasilitasi-cat/rekapitulasi',
    onExecuteQuery: executeQuery,
    onClearData: clearDashboardData,
    clearSubmittedOnCascadeChange: false,
  })

  const handleGoToLaporan = () => {
    if (!activeJenisTes) return
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
  }

  // --------------------------------------------------------------------------
  // SESSIONS FILTERED BY APPLIED MULTI-INSTANSI SELECTION
  // --------------------------------------------------------------------------
  const displaySessions = useMemo(() => {
    if (!appliedFilters?.instansiIds || appliedFilters.instansiIds.length === 0) {
      return sessions
    }
    // Jika semua instansi terpilih, tidak perlu filter
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

  // --------------------------------------------------------------------------
  // CALCULATIONS & AGGREGATIONS FOR MINI DASHBOARD
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    let totalHadir = 0
    let totalTidakHadir = 0
    let totalReschedule = 0
    let totalPesertaAlokasi = 0
    let minScore = Infinity
    let maxScore = -Infinity
    let hasValidScore = false

    displaySessions.forEach((s) => {
      const h = Number(s.hadir || 0)
      const th = Number(s.tidak_hadir || 0)
      const resch = Number(s.reschedule || 0)
      const kuota = Number(s.kuota || 0) || h + th

      totalHadir += h
      totalTidakHadir += th
      totalReschedule += resch
      totalPesertaAlokasi += kuota

      const nMin = parseFloat(s.nilai_min)
      const nMax = parseFloat(s.nilai_max)
      if (!isNaN(nMin) && s.nilai_min !== '-' && nMin > 0) {
        minScore = Math.min(minScore, nMin)
        hasValidScore = true
      }
      if (!isNaN(nMax) && s.nilai_max !== '-' && nMax > 0) {
        maxScore = Math.max(maxScore, nMax)
        hasValidScore = true
      }
    })

    const totalCalculatedPeserta = totalPesertaAlokasi || totalHadir + totalTidakHadir
    const persenKehadiran =
      totalCalculatedPeserta > 0
        ? ((totalHadir / totalCalculatedPeserta) * 100).toFixed(1)
        : '0.0'

    return {
      totalSesi: displaySessions.length,
      totalPeserta: totalCalculatedPeserta,
      totalHadir,
      totalTidakHadir,
      totalReschedule,
      persenKehadiran: Number(persenKehadiran),
      minScore: hasValidScore && minScore !== Infinity ? minScore : '-',
      maxScore: hasValidScore && maxScore !== -Infinity ? maxScore : '-',
    }
  }, [displaySessions])

  // --------------------------------------------------------------------------
  // CHART 1: LINE / AREA CHART (Tren Kehadiran Temporal / Sesi)
  // --------------------------------------------------------------------------
  const trendChartData = useMemo(() => {
    // Sort chronological (oldest to newest) for chart timeline
    const chronological = [...displaySessions].reverse()

    const categories = chronological.map((s, idx) => {
      const datePart = s.period_date ? formatDate(s.period_date) : `Sesi ${idx + 1}`
      return `${datePart} (S${s.sesi || idx + 1})`
    })

    const hadirSeries = chronological.map((s) => Number(s.hadir || 0))
    const tidakHadirSeries = chronological.map((s) => Number(s.tidak_hadir || 0))

    const series = [
      { name: 'Peserta Hadir', data: hadirSeries },
      { name: 'Tidak Hadir', data: tidakHadirSeries },
    ]

    const options = {
      chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: 'inherit',
        zoom: { enabled: false },
      },
      colors: ['#10B981', '#F43F5E'], // Emerald & Rose
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          rotate: -25,
          rotateAlways: categories.length > 6,
          trim: true,
          maxHeight: 60,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          formatter: (val) => formatNumber(val),
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontWeight: 600,
        labels: { colors: '#475569' },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { left: 10, right: 10 },
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: 'light',
        y: {
          formatter: (val) => `${formatNumber(val)} Peserta`,
        },
      },
    }

    return { series, options }
  }, [displaySessions])

  // --------------------------------------------------------------------------
  // CHART 2: BAR CHART (Perbandingan Kehadiran per Instansi)
  // --------------------------------------------------------------------------
  const instansiBarChartData = useMemo(() => {
    const instansiAgg = {}

    displaySessions.forEach((s) => {
      const name = s.instansi_nama || 'Instansi Peserta'
      if (!instansiAgg[name]) {
        instansiAgg[name] = { hadir: 0, tidakHadir: 0 }
      }
      instansiAgg[name].hadir += Number(s.hadir || 0)
      instansiAgg[name].tidakHadir += Number(s.tidak_hadir || 0)
    })

    const categories = Object.keys(instansiAgg).slice(0, 10) // Limit to top 10 for neat rendering
    const hadirData = categories.map((c) => instansiAgg[c].hadir)
    const tidakHadirData = categories.map((c) => instansiAgg[c].tidakHadir)

    const series = [
      { name: 'Hadir', data: hadirData },
      { name: 'Tidak Hadir', data: tidakHadirData },
    ]

    const options = {
      chart: {
        type: 'bar',
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      colors: ['#175CD3', '#F59E0B'], // Primary Blue & Amber
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 6,
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: {
        categories: categories.map((c) => (c.length > 20 ? c.slice(0, 20) + '…' : c)),
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          rotate: -20,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          formatter: (val) => formatNumber(val),
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontWeight: 600,
        labels: { colors: '#475569' },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: 'light',
        y: {
          formatter: (val) => `${formatNumber(val)} Peserta`,
        },
      },
    }

    return { series, options, count: categories.length }
  }, [displaySessions])

  // --------------------------------------------------------------------------
  // CHART 3: DONUT CHART (Proporsi Presensi Hadir vs Tidak Hadir vs Reschedule)
  // --------------------------------------------------------------------------
  const donutChartData = useMemo(() => {
    const hadir = metrics.totalHadir
    const tidakHadir = metrics.totalTidakHadir
    const reschedule = metrics.totalReschedule

    const series = [hadir, tidakHadir, reschedule]
    const labels = ['Hadir', 'Tidak Hadir', 'Reschedule']

    const options = {
      chart: {
        type: 'donut',
        fontFamily: 'inherit',
      },
      labels,
      colors: ['#10B981', '#F43F5E', '#F59E0B'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Peserta',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                formatter: () => formatNumber(metrics.totalPeserta),
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        fontSize: '11px',
        fontWeight: 600,
        labels: { colors: '#475569' },
      },
      stroke: { width: 0 },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val) => `${formatNumber(val)} Peserta`,
        },
      },
    }

    return { series, options }
  }, [metrics])

  // --------------------------------------------------------------------------
  // TABLE SEARCH & PAGINATION
  // --------------------------------------------------------------------------
  const filteredSessions = useMemo(() => {
    if (!tableSearch) return displaySessions
    const q = tableSearch.toLowerCase()
    return displaySessions.filter((s) => {
      const matchInstansi = (s.instansi_nama || '').toLowerCase().includes(q)
      const matchSesi = String(s.sesi || '').includes(q)
      const matchDate = (s.period_date || '').toLowerCase().includes(q)
      return matchInstansi || matchSesi || matchDate
    })
  }, [displaySessions, tableSearch])

  const paginatedSessions = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredSessions.slice(startIndex, startIndex + pageSize)
  }, [filteredSessions, page, pageSize])

  // --------------------------------------------------------------------------
  // EXPORT TABLE DATA TO NATIVE EXCEL (.xlsx)
  // --------------------------------------------------------------------------
  const handleExportExcel = () => {
    if (!displaySessions || displaySessions.length === 0) {
      toast.warning('Tidak ada data sesi untuk diekspor.')
      return
    }

    const tilokName = currentSelectedTilok?.nama_tilok || 'Semua Tilok'
    const kegiatanName = currentSelectedKegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'Rekapitulasi CAT'

    const exportData = displaySessions.map((r, idx) => {
      const totalPeserta = Number(r.kuota || 0) || Number(r.hadir || 0) + Number(r.tidak_hadir || 0)
      const persen = totalPeserta > 0 ? Number(((Number(r.hadir || 0) / totalPeserta) * 100).toFixed(1)) : 0

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
        'Presensi (%)': persen,
        Reschedule: Number(r.reschedule || 0),
        'Nilai Min': r.nilai_min !== '-' && r.nilai_min !== undefined ? Number(r.nilai_min) || r.nilai_min : '-',
        'Nilai Max': r.nilai_max !== '-' && r.nilai_max !== undefined ? Number(r.nilai_max) || r.nilai_max : '-',
        Pencatat: r.created_by || '-',
        'Waktu Input': r.created_at || '-',
      }
    })

    const sanitizeName = (activeJenisTes?.display_nama || 'event').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    exportToXlsx({
      filename: `rekapitulasi_cat_${sanitizeName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Rekapitulasi Sesi CAT',
      data: exportData,
    })
  }

  // --------------------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. SERVICE HEADER PAGE (STANDARISASI_UI_UX_MASTER_SSOT.md) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Rekapitulasi Pelaksanaan Seleksi CAT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Mini dashboard analitik dan ringkasan eksekutif capaian pelaksanaan Computer Assisted Test (CAT).
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

        {/* Action Buttons (Right) */}
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
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${isJenisLoading || isSessionsLoading ? 'animate-spin text-[#175CD3]' : ''}`}
            />
            <span>Muat Ulang</span>
          </button>

          {activeJenisTes && filterTilokUid && (
            <button
              type="button"
              onClick={handleGoToLaporan}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#175CD3] dark:text-blue-300 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Buka Pembuat Dokumen Laporan CAT dengan parameter saat ini"
            >
              <FileText className="w-4 h-4 text-[#175CD3] dark:text-blue-400" />
              <span>Buat Laporan CAT</span>
            </button>
          )}

          {activeJenisTes && hasSubmitted && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isSessionsLoading || displaySessions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ekspor Data Rekapitulasi ke Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. LEVEL 1: GRID JENIS TES BESAR CAT (SHARED COMPONENT) */}
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

      {/* 3. LEVEL 2: CASCADING FILTER EVENT + GATED MINI DASHBOARD */}
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
                const newIds = await loadInstansiForTilokAndKegiatan(filterTilokUid, filterSeleksiId)
                if (appliedFilters) {
                  applyFilters({ ...appliedFilters, instansiIds: newIds })
                }
              }
            }}
            onSubmit={(e) => handleSearchSubmit(e, { includeDateRange: true })}
            onResetFilter={handleResetFilter}
            isSubmitting={isSessionsLoading}
            submitLabel="Terapkan Rekapitulasi"
            submitTitle="Terapkan Filter & Muat Rekapitulasi"
            showDateRange
            filterTglMulai={filterTglMulai}
            filterTglSelesai={filterTglSelesai}
            onTglMulaiChange={setFilterTglMulai}
            onTglSelesaiChange={setFilterTglSelesai}
            onClearDateRange={() => {
              setFilterTglMulai('')
              setFilterTglSelesai('')
            }}
            extraActionButton={
              filterTilokUid ? (
                <button
                  type="button"
                  onClick={handleGoToLaporan}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#175CD3] dark:text-blue-300 text-xs font-bold transition-all cursor-pointer"
                  title="Buat Laporan CAT Langsung"
                >
                  <FileText className="w-3.5 h-3.5 text-[#175CD3]" />
                  <span>Buat Laporan CAT</span>
                </button>
              ) : null
            }
          />

          {/* GATING: EMPTY STATE PROMPT SEBELUM FILTER DI-SUBMIT */}
          {!hasSubmitted ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Rekapitulasi Belum Dimuat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Silakan tentukan <strong>Kegiatan Seleksi</strong> dan <strong>Titik Lokasi (Tilok)</strong> pada
                  panel filter di atas, kemudian klik tombol <strong>"Terapkan Rekapitulasi"</strong> untuk memuat data.
                </p>
              </div>
            </div>
          ) : isSessionsLoading ? (
            /* SKELETON LOADING KETIKA DATA SEDANG DIAMBIL */
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
                <div className="h-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
              </div>
              <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            /* EMPTY STATE JIKA TIDAK ADA DATA PADA FILTER */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak Ada Data Sesi Ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Belum ada transaksi sesi ujian yang tercatat untuk kombinasi Kegiatan, Tilok, atau Instansi yang Anda
                pilih.
              </p>
            </div>
          ) : (
            /* KONTEN MINI DASHBOARD / LAYOUT EDITOR LAPORAN REKAPITULASI */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* SECTION A: 4 BENTO KPI CARDS (FOKUS UTAMA: KEHADIRAN PESERTA) */}
              <KpiCardGrid
                borderless
                gridClassName="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                kpis={[
                  {
                    id: 'total_terdaftar',
                    label: 'Total Peserta Terdaftar',
                    value: metrics.totalPeserta,
                    unit: 'Peserta',
                    context: `Kuota peserta dalam ${metrics.totalSesi} sesi`,
                    badge: 'Total Alokasi',
                    badgeColor: 'blue',
                    icon: Users,
                    iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
                  },
                  {
                    id: 'peserta_hadir',
                    label: 'Peserta Hadir Ujian',
                    value: metrics.totalHadir,
                    unit: 'Peserta',
                    context: 'Mengikuti ujian di workstation PC',
                    badge: 'Realisasi',
                    badgeColor: 'emerald',
                    icon: UserCheck,
                    iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                    valueClassName: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    id: 'tidak_hadir',
                    label: 'Peserta Tidak Hadir',
                    value: metrics.totalTidakHadir,
                    unit: 'Peserta',
                    context: 'Absen / tanpa keterangan',
                    badge: 'Tidak Hadir',
                    badgeColor: 'rose',
                    icon: XCircle,
                    iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
                    valueClassName: 'text-rose-600 dark:text-rose-400',
                  },
                  {
                    id: 'tingkat_kehadiran',
                    label: 'Tingkat Kehadiran',
                    value: metrics.persenKehadiran,
                    suffix: '%',
                    context: 'Rasio presensi peserta ujian',
                    badge:
                      metrics.persenKehadiran >= 95
                        ? 'Sangat Baik'
                        : metrics.persenKehadiran >= 85
                        ? 'Cukup Baik'
                        : 'Perlu Evaluasi',
                    badgeColor:
                      metrics.persenKehadiran >= 95
                        ? 'emerald'
                        : metrics.persenKehadiran >= 85
                        ? 'amber'
                        : 'rose',
                    icon: CheckCircle2,
                    iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
                  },
                ]}
              />

              {/* SECONDARY STRIP: NILAI MIN/MAX & METRIK TAMBAHAN (NON-HIGHLIGHT) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Informasi Sekunder Event:
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-400">Total Sesi:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-100">{metrics.totalSesi} Sesi</strong>
                  </div>
                  {metrics.totalReschedule > 0 && (
                    <div>
                      <span className="text-slate-400">Reschedule:</span>{' '}
                      <strong className="text-amber-600 dark:text-amber-400">
                        {formatNumber(metrics.totalReschedule)} Peserta
                      </strong>
                    </div>
                  )}
                  {metrics.minScore !== '-' && (
                    <div>
                      <span className="text-slate-400">Nilai Min:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-100">{metrics.minScore}</strong>
                    </div>
                  )}
                  {metrics.maxScore !== '-' && (
                    <div>
                      <span className="text-slate-400">Nilai Max:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-100">{metrics.maxScore}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: VISUALISASI GRAFIK INTERAKTIF (LINE & DONUT) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* GRAFIK 1: TREN KEHADIRAN PER SESI / HARI (LINE / AREA) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Tren Kehadiran Peserta per Sesi</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dinamika peserta hadir vs tidak hadir di setiap nomor sesi pelaksanaan
                      </p>
                    </div>
                  </div>
                  <div className="h-[270px]">
                    <ReactApexChart
                      options={trendChartData.options}
                      series={trendChartData.series}
                      type="area"
                      height="100%"
                    />
                  </div>
                </div>

                {/* GRAFIK 2: PROPORSI STATUS PRESENSI (DONUT CHART) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-[#175CD3]" />
                          <span>Proporsi Presensi</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Komposisi Hadir, Absen, dan Susulan</p>
                      </div>
                    </div>
                    <div className="h-[220px]">
                      <ReactApexChart
                        options={donutChartData.options}
                        series={donutChartData.series}
                        type="donut"
                        height="100%"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 text-center text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hadir</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatNumber(metrics.totalHadir)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tidak Hadir</span>
                      <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatNumber(metrics.totalTidakHadir)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reschedule</span>
                      <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatNumber(metrics.totalReschedule)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRAFIK 3 (OPSIONAL JIKA MULTI-INSTANSI): BAR CHART PERBANDINGAN INSTANSI */}
              {instansiBarChartData.count > 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#175CD3]" />
                        <span>Komparasi Kehadiran Antar Instansi Peserta</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Perbandingan rasio peserta hadir dan tidak hadir pada masing-masing instansi yang terdaftar
                      </p>
                    </div>
                  </div>
                  <div className="h-[260px]">
                    <ReactApexChart
                      options={instansiBarChartData.options}
                      series={instansiBarChartData.series}
                      type="bar"
                      height="100%"
                    />
                  </div>
                </div>
              )}

              {/* SECTION C: TABEL REKAPITULASI DATA SESI & INSTANSI (DENGAN EXPORT & PAGINASI) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
                {/* Table Toolbar Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Rincian Pelaksanaan per Sesi Ujian
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Menampilkan data riil realisasi kehadiran per tanggal dan sesi ujian
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Search inside table */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari sesi / instansi..."
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value)
                          setPage(1)
                        }}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                      />
                    </div>

                    {/* Tombol Export di Toolbar Tabel */}
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={displaySessions.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      title="Download tabel rekapitulasi ke Excel (.xlsx)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Download Excel</span>
                    </button>
                  </div>
                </div>

                {/* Table Data (Standardisasi PEDOMAN_STANDARISASI_TABLE_MASTER.md) */}
                <div className="overflow-x-auto clean-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4 min-w-[220px]">Instansi Peserta</th>
                        <th className="py-3.5 px-3.5 text-center w-36">Tanggal &amp; Sesi</th>
                        <th className="py-3.5 px-3.5 text-center w-44">Kehadiran (H / TH / Alokasi)</th>
                        <th className="py-3.5 px-3.5 text-center w-24">Presensi</th>
                        <th className="py-3.5 px-3.5 text-center w-28">Nilai (Min-Max)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-semibold">
                      {paginatedSessions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                            Tidak ada data sesi yang sesuai dengan pencarian tabel.
                          </td>
                        </tr>
                      ) : (
                        paginatedSessions.map((row, idx) => {
                          const totalSesiPeserta =
                            Number(row.kuota || 0) || Number(row.hadir || 0) + Number(row.tidak_hadir || 0)
                          const persen =
                            totalSesiPeserta > 0
                              ? ((Number(row.hadir || 0) / totalSesiPeserta) * 100).toFixed(1)
                              : '0.0'

                          return (
                            <tr
                              key={row.id || idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <SidigiDataOriginIcon isExcel={isExcelOrigin(row)} />
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-xs">
                                      {row.instansi_nama || `Instansi ${row.instansi_id}`}
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                      No. {(page - 1) * pageSize + idx + 1}
                                      {row.tilok_nama ? ` • ${row.tilok_nama}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-center">
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{formatDate(row.period_date)}</span>
                                </div>
                                <div className="text-[11px] font-bold text-[#175CD3] dark:text-blue-400 mt-0.5">
                                  Sesi {row.sesi || 1}
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-center tabular-nums">
                                <div className="inline-flex items-center gap-2 text-xs font-bold">
                                  <span className="text-emerald-600 dark:text-emerald-400">{formatNumber(row.hadir)}</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-rose-600 dark:text-rose-400">{formatNumber(row.tidak_hadir)}</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-slate-900 dark:text-slate-100">{formatNumber(totalSesiPeserta)}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-center">
                                <span
                                  className={`font-extrabold text-xs sm:text-sm tabular-nums ${
                                    Number(persen) >= 95
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : Number(persen) >= 85
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {persen}%
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5 text-center text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                {row.nilai_min !== '-' && row.nilai_max !== '-' && row.nilai_min !== undefined ? (
                                  <span>
                                    {row.nilai_min} - {row.nilai_max}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600 font-semibold">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Card Footer Integrated Pagination (SSOT Acuan /layanan/sistem-merit) */}
                <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {filteredSessions.length === 0 ? 0 : (page - 1) * pageSize + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {Math.min(page * pageSize, filteredSessions.length)}
                    </span>{' '}
                    dari{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {filteredSessions.length}
                    </span>{' '}
                    sesi terdata
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Tampilkan:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setPage(1)
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        <option value={10}>10 baris</option>
                        <option value={25}>25 baris</option>
                        <option value={50}>50 baris</option>
                        <option value={100}>100 baris</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        &lt;
                      </button>
                      <span className="px-2.5 py-1 text-xs font-bold text-[#175CD3] dark:text-blue-400">
                        {page} / {Math.max(1, Math.ceil(filteredSessions.length / pageSize))}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(Math.ceil(filteredSessions.length / pageSize), p + 1))
                        }
                        disabled={page >= Math.ceil(filteredSessions.length / pageSize)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
