import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Plus,
  CalendarClock,
  FileCheck2,
  Clock,
  Users,
  Edit3,
  Trash2,
  CheckCircle2,
  BarChart3,
  Table2,
  CalendarDays,
  Building2,
  AlertCircle,
  Calendar,
  Link2,
  Layers,
  RotateCcw,
  Search,
} from 'lucide-react'
import { SearchableSelect } from '../../../components/shared/SearchableSelect'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import { CatPengelolaJadwalModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaJadwalModal'
import { CatPengelolaJadwalCalendar } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaJadwalCalendar'
import { CatPengelolaLinkStModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaLinkStModal'
import { CatPengelolaConfirmModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaConfirmModal'
import { CatPengelolaAssignRekapModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaAssignRekapModal'
import {
  JADWAL_STATUS_META,
  ST_STATUS_META,
  formatDateRangeId,
  formatTanggalId,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  fetchCatPengelolaJadwal,
  deleteCatPengelolaJadwal,
  fetchCatJenisPeriodeList,
} from '../../../services/api/sidigiCatServicesApi'
import {
  encodeCatJenisToken,
  encodeCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'

function JadwalContent() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({})
  const [jenisPeriodeList, setJenisPeriodeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'calendar'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [initialModalDates, setInitialModalDates] = useState(null)
  const [linkingJadwal, setLinkingJadwal] = useState(null)
  const [assignRekapJadwal, setAssignRekapJadwal] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cascading Filter Dropdown State (Parity dengan /rekap-data via SearchableSelect)
  const [filterTahun, setFilterTahun] = useState('')
  const [filterJenisTes, setFilterJenisTes] = useState('')
  const [filterKegiatan, setFilterKegiatan] = useState('')
  const [filterTilok, setFilterTilok] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const [jadwalRes, jpList] = await Promise.all([
        fetchCatPengelolaJadwal(),
        fetchCatJenisPeriodeList('').catch(() => []),
      ])
      setRows(jadwalRes.rows)
      setSummary(jadwalRes.summary)
      setJenisPeriodeList(Array.isArray(jpList) ? jpList : [])
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat jadwal kegiatan CAT.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, activeCategory])

  const categories = useMemo(
    () => [
      { value: 'all', label: 'Semua' },
      { value: 'aktif', label: 'Aktif' },
      { value: 'draft', label: 'Draft' },
      { value: 'selesai', label: 'Selesai' },
      { value: 'batal', label: 'Batal' },
    ],
    []
  )

  const categoryCounts = useMemo(() => {
    return {
      all: rows.length,
      aktif: rows.filter((r) => r.status === 'aktif').length,
      draft: rows.filter((r) => r.status === 'draft').length,
      selesai: rows.filter((r) => r.status === 'selesai').length,
      batal: rows.filter((r) => r.status === 'batal').length,
    }
  }, [rows])

  // Ekstrak opsi hierarki filter dari master data & data rows untuk SearchableSelect (react-select)
  const tahunSelectOptions = useMemo(() => {
    const set = new Set(['2026', '2025', '2024', '2023'])
    const curYear = new Date().getFullYear().toString()
    set.add(curYear)

    // Dari master jenis periode (cfg_cat_jenis_periode / txn_cat_jenis_periode)
    jenisPeriodeList.forEach((jp) => {
      if (jp.periode) set.add(String(jp.periode))
    })

    // Dari data jadwal aktual
    rows.forEach((r) => {
      const t =
        r.jenis_periode_tahun ||
        r.seleksi_periode ||
        (r.tanggal_mulai ? r.tanggal_mulai.substring(0, 4) : null)
      if (t) set.add(String(t))
    })

    return Array.from(set)
      .sort((a, b) => Number(b) - Number(a))
      .map((t) => ({ value: String(t), label: `Tahun ${t}` }))
  }, [rows, jenisPeriodeList])

  const jenisTesSelectOptions = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const id = String(r.jenis_tes_id || '')
      if (id && !map.has(id)) {
        map.set(id, r.jenis_tes_nama || r.jenis_tes_kode || `Jenis Tes ${id}`)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [rows])

  const kegiatanSelectOptions = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const matchTahun =
        !filterTahun ||
        String(
          r.jenis_periode_tahun ||
            r.seleksi_periode ||
            r.tanggal_mulai?.substring(0, 4)
        ) === String(filterTahun)
      const matchJenis =
        !filterJenisTes || String(r.jenis_tes_id) === String(filterJenisTes)
      if (matchTahun && matchJenis && r.seleksi_id) {
        const id = String(r.seleksi_id)
        if (!map.has(id)) {
          map.set(id, r.nama_seleksi || `Kegiatan ${id}`)
        }
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [rows, filterTahun, filterJenisTes])

  const tilokSelectOptions = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const matchTahun =
        !filterTahun ||
        String(
          r.jenis_periode_tahun ||
            r.seleksi_periode ||
            r.tanggal_mulai?.substring(0, 4)
        ) === String(filterTahun)
      const matchJenis =
        !filterJenisTes || String(r.jenis_tes_id) === String(filterJenisTes)
      const matchKegiatan =
        !filterKegiatan || String(r.seleksi_id) === String(filterKegiatan)
      if (matchTahun && matchJenis && matchKegiatan && (r.tilok_id || r.tilok_uid)) {
        const key = String(r.tilok_id || r.tilok_uid)
        if (!map.has(key)) {
          map.set(key, r.nama_tilok || `Tilok ${key}`)
        }
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [rows, filterTahun, filterJenisTes, filterKegiatan])

  const handleResetFilter = useCallback(() => {
    setFilterTahun('')
    setFilterJenisTes('')
    setFilterKegiatan('')
    setFilterTilok('')
    setPage(1)
  }, [])

  const filteredRows = useMemo(() => {
    let list = rows
    if (activeCategory && activeCategory !== 'all') {
      list = list.filter((r) => r.status === activeCategory)
    }

    if (filterTahun) {
      list = list.filter(
        (r) =>
          String(
            r.jenis_periode_tahun ||
              r.seleksi_periode ||
              r.tanggal_mulai?.substring(0, 4)
          ) === String(filterTahun)
      )
    }

    if (filterJenisTes) {
      list = list.filter((r) => String(r.jenis_tes_id) === String(filterJenisTes))
    }

    if (filterKegiatan) {
      list = list.filter((r) => String(r.seleksi_id) === String(filterKegiatan))
    }

    if (filterTilok) {
      list = list.filter(
        (r) =>
          String(r.tilok_id) === String(filterTilok) ||
          String(r.tilok_uid) === String(filterTilok)
      )
    }

    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [
          r.nama_jadwal,
          r.jenis_tes_nama,
          r.jenis_periode_tahun,
          r.seleksi_periode,
          r.nama_seleksi,
          r.nama_tilok,
          r.instansi_nama,
          r.nomor_st,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }

    return list
  }, [
    rows,
    activeCategory,
    filterTahun,
    filterJenisTes,
    filterKegiatan,
    filterTilok,
    searchTerm,
  ])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const kpis = useMemo(
    () => [
      {
        label: 'Total Jadwal',
        value: Number(summary?.total_jadwal ?? rows.length),
        unit: 'jadwal',
        context: `${rows.length} sesuai filter aktif`,
        badge: 'Kegiatan CAT',
        badgeColor: 'indigo',
        icon: CalendarClock,
      },
      {
        label: 'Menunggu ST (Menyusul)',
        value: rows.filter((r) => r.st_status !== 'terhubung').length,
        unit: 'jadwal',
        context: 'Dapat ditautkan saat ST terbit',
        badge: 'ST Menyusul',
        badgeColor: 'amber',
        icon: Clock,
      },
      {
        label: 'ST Sudah Terhubung',
        value: rows.filter((r) => r.st_status === 'terhubung').length,
        unit: 'jadwal',
        context: 'Nomor ST aktif & tersinkron',
        badge: 'Lengkap ST',
        badgeColor: 'emerald',
        icon: FileCheck2,
      },
      {
        label: 'Total Personel Tim',
        value: rows.reduce((acc, r) => acc + Number(r.total_tim || 0), 0),
        unit: 'penugasan',
        context: 'Koordinator, IT & Pengawas',
        badge: 'Tim Pelaksana',
        badgeColor: 'blue',
        icon: Users,
      },
    ],
    [summary, rows]
  )

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteCatPengelolaJadwal(deletingItem.uid || deletingItem.id)
      setDeletingItem(null)
      await loadData()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menghapus jadwal kegiatan.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenCrossModule = (row, basePath) => {
    const matchedJp =
      jenisPeriodeList.find(
        (jp) =>
          String(jp.jenis_tes_id) === String(row.jenis_tes_id) &&
          (!row.seleksi_periode || String(jp.periode) === String(row.seleksi_periode))
      ) || jenisPeriodeList.find((jp) => String(jp.jenis_tes_id) === String(row.jenis_tes_id))

    if (!matchedJp) {
      navigate(basePath)
      return
    }

    const jenisToken = encodeCatJenisToken(matchedJp)
    const instansiIds = Array.isArray(row.instansi_list)
      ? row.instansi_list.map((i) => String(i.instansi_id || i.kodeins)).filter(Boolean)
      : row.instansi_id
      ? [String(row.instansi_id)]
      : []

    const filterToken = encodeCatFilterToken({
      seleksiId: row.seleksi_id ? String(row.seleksi_id) : '',
      tilokUid: row.tilok_uid || '',
      instansiIds,
      tglMulai: row.tanggal_mulai || '',
      tglSelesai: row.tanggal_selesai || '',
    })

    navigate(buildCatModuleUrl(basePath, jenisToken, filterToken))
  }

  const handleCreateAtDate = (dateStr) => {
    setEditingItem(null)
    setInitialModalDates({ startDate: dateStr, endDate: dateStr })
    setIsModalOpen(true)
  }

  const viewModeControls = (
    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
      <button
        type="button"
        onClick={() => setViewMode('table')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          viewMode === 'table'
            ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Table2 className="w-3.5 h-3.5" />
        <span>Tabel</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('calendar')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          viewMode === 'calendar'
            ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>Kalender</span>
      </button>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Manajemen Jadwal Kegiatan CAT"
        description="Pengaturan jadwal pelaksanaan CAT, titik lokasi, instansi opsional, dan status ST."
        onReload={loadData}
        isReloading={loading}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setInitialModalDates(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Jadwal</span>
          </button>
        }
      />

      <PmaKpiGrid kpis={kpis} isLoading={loading} />

      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* UNIFIED SECTION FILTER (GABUNGAN STATUS, PENCARIAN & PARAMETER PELAKSANAAN) */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4 border border-slate-200/60 dark:border-slate-800">
        {/* Tier 1: Pencarian Cepat, Tab Status Jadwal & Mode Tampilan */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama jadwal, tilok, instansi, atau nomor ST..."
              className="w-full h-[38px] pl-10 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls: Category Pills & View Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 justify-between sm:justify-end">
            {/* Status Pills */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto clean-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Semua ({categoryCounts.all || 0})
              </button>
              {categories.map((cat) => {
                const count = categoryCounts[cat.id] || 0
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* View Switcher (Tabel / Kalender) */}
            {viewModeControls}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/70" />

        {/* Tier 2: Filter Parameter Pelaksanaan (Cascading 4 Level) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Filter Parameter Pelaksanaan
              </h2>
              <span className="text-[11px] text-slate-400 font-normal">
                (Tahun → Jenis Tes → Kegiatan → Tilok)
              </span>
            </div>
            {Boolean(filterTahun || filterJenisTes || filterKegiatan || filterTilok) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] font-semibold text-[#175CD3] dark:text-blue-300">
                <span>Konteks aktif: otomatis terisi saat Buat Jadwal</span>
              </span>
            )}
          </div>

          {/* 4 Cascading Dropdowns dengan SearchableSelect (react-select) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* STEP 1: Periode Tahun */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Periode Tahun
              </label>
              <SearchableSelect
                options={tahunSelectOptions}
                value={filterTahun}
                onChange={(val) => {
                  setFilterTahun(val || '')
                  setFilterKegiatan('')
                  setFilterTilok('')
                  setPage(1)
                }}
                placeholder="-- Semua Tahun --"
                isClearable={true}
                noOptionsText="Tidak ada tahun"
              />
            </div>

            {/* STEP 2: Jenis Tes */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Jenis Tes
              </label>
              <SearchableSelect
                options={jenisTesSelectOptions}
                value={filterJenisTes}
                onChange={(val) => {
                  setFilterJenisTes(val || '')
                  setFilterKegiatan('')
                  setFilterTilok('')
                  setPage(1)
                }}
                placeholder="-- Semua Jenis Tes --"
                isClearable={true}
                noOptionsText="Tidak ada jenis tes"
              />
            </div>

            {/* STEP 3: Kegiatan Seleksi */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Kegiatan Seleksi
              </label>
              <SearchableSelect
                options={kegiatanSelectOptions}
                value={filterKegiatan}
                onChange={(val) => {
                  setFilterKegiatan(val || '')
                  setFilterTilok('')
                  setPage(1)
                }}
                placeholder={
                  kegiatanSelectOptions.length === 0
                    ? '-- Tidak ada kegiatan --'
                    : '-- Pilih Kegiatan (Wajib) --'
                }
                isClearable={true}
                noOptionsText="Tidak ada kegiatan sesuai filter"
              />
            </div>

            {/* STEP 4: Titik Lokasi (Tilok) */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Titik Lokasi (Tilok)
              </label>
              <SearchableSelect
                options={tilokSelectOptions}
                value={filterTilok}
                onChange={(val) => {
                  setFilterTilok(val || '')
                  setPage(1)
                }}
                placeholder={
                  !filterKegiatan
                    ? '-- Pilih Kegiatan Terlebih Dahulu --'
                    : tilokSelectOptions.length === 0
                    ? '-- Tidak ada titik lokasi --'
                    : '-- Pilih Titik Lokasi (Wajib) --'
                }
                isClearable={true}
                noOptionsText="Tidak ada tilok sesuai filter"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Menampilkan <strong>{filteredRows.length}</strong> dari {rows.length} total jadwal
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {Boolean(filterTahun || filterJenisTes || filterKegiatan || filterTilok) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  toast.info(`Menampilkan ${filteredRows.length} jadwal sesuai parameter filter.`)
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Terapkan filter data jadwal"
              >
                <Search className="w-4 h-4" />
                <span>Cari Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CatPengelolaJadwalCalendar
          rows={filteredRows}
          loading={loading}
          onCreateAtDate={handleCreateAtDate}
          onEdit={(row) => {
            setInitialModalDates(null)
            setEditingItem(row)
            setIsModalOpen(true)
          }}
          onDelete={(row) => setDeletingItem(row)}
          onLinkSt={(row) => setLinkingJadwal(row)}
          onOpenAssignRekap={(row) => setAssignRekapJadwal(row)}
          onOpenRekap={(row) => handleOpenCrossModule(row, '/layanan/fasilitasi-cat/rekapitulasi')}
          onOpenTim={(row) => navigate(`/layanan/fasilitasi-cat/pengelola/tim?jadwal_id=${row.id}`)}
          onOpenDokumen={(row) =>
            navigate(`/layanan/fasilitasi-cat/pengelola/dokumen?jadwal_id=${row.id}`)
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Jadwal & Jenis Tes</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tilok & Instansi</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Pelaksanaan</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Surat Tugas (ST)</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-medium">
                {loading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx} className="animate-pulse">
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4 text-center">
                        <div className="h-5 w-16 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <CalendarClock className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Tidak Ada Jadwal Kegiatan
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                        Belum ada jadwal kegiatan CAT yang sesuai dengan filter. Klik tombol "Buat Jadwal" untuk menambahkan jadwal baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const statusMeta = JADWAL_STATUS_META[row.status] || JADWAL_STATUS_META.aktif
                    const stMeta = ST_STATUS_META[row.st_status] || ST_STATUS_META.menunggu
                    const instansiNames =
                      Array.isArray(row.instansi_list) && row.instansi_list.length > 0
                        ? row.instansi_list
                            .map((i) => i.instansi_nama || i.nama || i.instansi_id)
                            .join(', ')
                        : row.instansi_nama || 'Lintas / Umum (Opsional)'

                    const cleanedTilok = (row.nama_tilok || 'Tilok belum ditentukan').replace(
                      /^(titik\s*lokasi|tilok\s*lokasi)\s*[-:]\s*/i,
                      ''
                    )

                    const scheduleSubtitle = [
                      row.jenis_tes_nama || row.jenis_tes_kode,
                      row.jenis_periode_tahun || row.seleksi_periode,
                      row.nama_seleksi && row.nama_seleksi !== row.nama_jadwal
                        ? row.nama_seleksi
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')

                    return (
                      <tr
                        key={row.uid || row.id}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[235px] xl:max-w-[300px]">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <CalendarClock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2"
                                title={row.nama_jadwal || row.nama_seleksi}
                              >
                                {row.nama_jadwal || row.nama_seleksi || 'Jadwal CAT'}
                              </div>
                              {scheduleSubtitle && (
                                <div
                                  className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate"
                                  title={scheduleSubtitle}
                                >
                                  {scheduleSubtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="max-w-[185px] xl:max-w-[230px]">
                            <div
                              className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug text-xs sm:text-[13px]"
                              title={cleanedTilok}
                            >
                              {cleanedTilok}
                            </div>
                            <div
                              className="text-[11px] font-normal text-slate-400 dark:text-slate-500 truncate mt-0.5 flex items-center gap-1.5"
                              title={instansiNames}
                            >
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{instansiNames}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDateRangeId(row.tanggal_mulai, row.tanggal_selesai)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border max-w-[190px] ${stMeta.badgeClass}`}
                            title={
                              row.st_status === 'terhubung' && (row.resolved_nomor_st || row.nomor_st)
                                ? row.resolved_nomor_st || row.nomor_st
                                : stMeta.label
                            }
                          >
                            {row.st_status === 'terhubung' ? (
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 shrink-0" />
                            )}
                            <span className="truncate">
                              {row.st_status === 'terhubung' && (row.resolved_nomor_st || row.nomor_st)
                                ? row.resolved_nomor_st || row.nomor_st
                                : stMeta.label}
                            </span>
                          </span>
                          {row.tanggal_st && (
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-1">
                              Tgl: {formatTanggalId(row.tanggal_st)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setAssignRekapJadwal(row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Lihat & Tautkan Rekap Sesi Lapangan"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLinkingJadwal(row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Tautkan / Update Nomor ST"
                            >
                              <FileCheck2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCrossModule(row, '/layanan/fasilitasi-cat/rekapitulasi')
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Buka di Rekapitulasi CAT"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInitialModalDates(null)
                                setEditingItem(row)
                                setIsModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Edit Jadwal"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Hapus Jadwal"
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

          <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
            <ServiceTablePagination
              page={page}
              pageSize={pageSize}
              totalRecords={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              unitLabel="jadwal"
            />
          </div>
        </div>
      )}

      <CatPengelolaJadwalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          setInitialModalDates(null)
        }}
        onSuccess={loadData}
        editingItem={editingItem}
        initialDates={initialModalDates}
        initialFilter={{
          tahun: filterTahun,
          jenisTesId: filterJenisTes,
          seleksiId: filterKegiatan,
          tilokId: filterTilok,
        }}
      />

      <CatPengelolaLinkStModal
        isOpen={Boolean(linkingJadwal)}
        jadwal={linkingJadwal}
        onClose={() => setLinkingJadwal(null)}
        onSuccess={loadData}
      />

      <CatPengelolaAssignRekapModal
        isOpen={Boolean(assignRekapJadwal)}
        jadwal={assignRekapJadwal}
        onClose={() => setAssignRekapJadwal(null)}
        onOpenRekapData={(j) =>
          handleOpenCrossModule(j, '/layanan/fasilitasi-cat/rekap-data')
        }
      />

      <CatPengelolaConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Hapus Jadwal Kegiatan CAT"
        description={`Jadwal "${deletingItem?.nama_jadwal || ''}" beserta relasi penugasan tim di dalamnya akan dihapus permanen. Lanjutkan?`}
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}

export default function FasilitasiCatPengelolaJadwalPage() {
  return (
    <CatPengelolaGateGuard>
      {() => <JadwalContent />}
    </CatPengelolaGateGuard>
  )
}
