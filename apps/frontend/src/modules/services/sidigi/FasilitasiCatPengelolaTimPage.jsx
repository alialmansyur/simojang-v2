import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Users,
  ShieldCheck,
  Cpu,
  UserCheck,
  CalendarClock,
  Calendar,
  MapPin,
  Building2,
  RotateCcw,
  Table2,
  CalendarDays,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import { CatPengelolaTimModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaTimModal'
import { CatPengelolaTimDetailModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaTimDetailModal'
import { CatPengelolaTimMatrix } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaTimMatrix'
import { CatPengelolaLinkStModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaLinkStModal'
import { CatPengelolaConfirmModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaConfirmModal'
import {
  getRoleMeta,
  formatTanggalId,
  formatDateRangeId,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  fetchCatPengelolaTim,
  fetchCatPengelolaJadwal,
  fetchCatPengelolaPegawaiOptions,
  fetchCatPengelolaUnitKerjaOptions,
  deleteCatPengelolaTim,
} from '../../../services/api/sidigiCatServicesApi'

function TimContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialJadwalId = searchParams.get('jadwal_id') || ''

  const [rows, setRows] = useState([])
  const [jadwalList, setJadwalList] = useState([])
  const [unitKerjaList, setUnitKerjaList] = useState([])
  const [pegawaiList, setPegawaiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMaster, setLoadingMaster] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [jadwalIdFilter, setJadwalIdFilter] = useState(initialJadwalId)
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'peta'

  // Period filter for Mode Peta (default = current month & year)
  const [mapMonth, setMapMonth] = useState(() => new Date().getMonth() + 1)
  const [mapYear, setMapYear] = useState(() => new Date().getFullYear())

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalJadwalId, setModalJadwalId] = useState('')
  const [editingMember, setEditingMember] = useState(null)
  const [modalPrefill, setModalPrefill] = useState(null)
  const [detailModalKey, setDetailModalKey] = useState(null)
  const [linkingJadwal, setLinkingJadwal] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load master jadwal & tim kerja pegawai once
  useEffect(() => {
    let active = true
    setLoadingMaster(true)
    Promise.all([
      fetchCatPengelolaJadwal().catch(() => ({ rows: [] })),
      fetchCatPengelolaUnitKerjaOptions().catch(() => []),
      fetchCatPengelolaPegawaiOptions('', 500, '').catch(() => []),
    ])
      .then(([jRes, ukRes, pegRes]) => {
        if (!active) return
        setJadwalList(Array.isArray(jRes?.rows) ? jRes.rows : [])
        setUnitKerjaList(Array.isArray(ukRes) ? ukRes : [])
        setPegawaiList(Array.isArray(pegRes) ? pegRes : [])
      })
      .finally(() => {
        if (active) setLoadingMaster(false)
      })
    return () => {
      active = false
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatPengelolaTim({
        jadwal_id: jadwalIdFilter,
        unit_kerja_id: unitKerjaFilter,
      })
      setRows(res.rows)
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat daftar tim fasilitasi CAT.')
    } finally {
      setLoading(false)
    }
  }, [jadwalIdFilter, unitKerjaFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [jadwalIdFilter, unitKerjaFilter, searchTerm, activeCategory])

  const selectedJadwal = useMemo(
    () => jadwalList.find((j) => String(j.id) === String(jadwalIdFilter)) || null,
    [jadwalList, jadwalIdFilter]
  )

  const jadwalSelectOptions = useMemo(
    () =>
      jadwalList.map((j) => {
        const periode = j.jenis_periode_tahun || j.seleksi_periode || ''
        const meta = [
          j.jenis_tes_kode || j.jenis_tes_nama,
          periode,
          j.nama_seleksi,
          j.nama_tilok,
        ]
          .filter(Boolean)
          .join(' • ')
        return {
          value: String(j.id),
          label: meta ? `${j.nama_jadwal} — ${meta}` : j.nama_jadwal,
        }
      }),
    [jadwalList]
  )

  const unitKerjaOptions = useMemo(
    () =>
      unitKerjaList.map((u) => ({
        value: String(u.id),
        label: u.nama,
      })),
    [unitKerjaList]
  )

  const handleChangeJadwalFilter = (val) => {
    const nextVal = val || ''
    setJadwalIdFilter(nextVal)
    if (nextVal) {
      setSearchParams({ jadwal_id: nextVal })
    } else {
      setSearchParams({})
    }
  }

  const categories = useMemo(
    () => [
      { value: 'all', label: 'Semua' },
      { value: 'Koordinator', label: 'Koordinator' },
      { value: 'IT', label: 'Tim IT' },
      { value: 'Pengawas', label: 'Pengawas' },
      { value: 'st_pending', label: 'ST Menyusul' },
    ],
    []
  )

  const categoryCounts = useMemo(
    () => ({
      all: rows.length,
      Koordinator: rows.filter((r) => String(r.peran).toLowerCase() === 'koordinator').length,
      IT: rows.filter((r) => String(r.peran).toLowerCase() === 'it').length,
      Pengawas: rows.filter((r) => String(r.peran).toLowerCase() === 'pengawas').length,
      st_pending: rows.filter(
        (r) => (r.resolved_st_status || r.jadwal_st_status) !== 'terhubung'
      ).length,
    }),
    [rows]
  )

  const filteredRows = useMemo(() => {
    let list = rows
    if (activeCategory === 'st_pending') {
      list = list.filter((r) => (r.resolved_st_status || r.jadwal_st_status) !== 'terhubung')
    } else if (activeCategory && activeCategory !== 'all') {
      list = list.filter((r) => String(r.peran).toLowerCase() === activeCategory.toLowerCase())
    }

    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [
          r.nama,
          r.nip,
          r.jabatan,
          r.unit_kerja_nama,
          r.nama_jadwal,
          r.nama_seleksi,
          r.nama_tilok,
          r.jenis_tes_nama,
          r.instansi_nama,
          r.nomor_st || r.jadwal_nomor_st,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }

    return list
  }, [rows, activeCategory, searchTerm])

  // Filtered employee pool for Mode Peta (filtered by Tim Kerja + search keyword)
  const filteredPegawaiForMap = useMemo(() => {
    let list = pegawaiList
    if (unitKerjaFilter) {
      list = list.filter((p) => String(p.unit_kerja_id || '') === String(unitKerjaFilter))
    }
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      const matchedAssignedNips = new Set(filteredRows.map((r) => String(r.nip)))
      list = list.filter(
        (p) =>
          matchedAssignedNips.has(String(p.nip)) ||
          [p.nama, p.nip, p.jabatan, p.unit_kerja_nama]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
      )
    }
    return list
  }, [pegawaiList, unitKerjaFilter, searchTerm, filteredRows])

  const jadwalByIdMap = useMemo(() => {
    const map = new Map()
    jadwalList.forEach((j) => {
      map.set(String(j.id), j)
    })
    return map
  }, [jadwalList])

  const groupedJadwalRows = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((row) => {
      const key = String(row.jadwal_id || row.jadwal_uid || row.nama_jadwal || row.id)
      const jadwalMeta = jadwalByIdMap.get(String(row.jadwal_id)) || null

      if (!map.has(key)) {
        map.set(key, {
          key,
          jadwalId: row.jadwal_id,
          jadwalUid: row.jadwal_uid || jadwalMeta?.uid || '',
          namaJadwal: jadwalMeta?.nama_jadwal || row.nama_jadwal || '-',
          jenisTesNama: jadwalMeta?.jenis_tes_nama || row.jenis_tes_nama || '',
          periode:
            jadwalMeta?.jenis_periode_tahun ||
            jadwalMeta?.seleksi_periode ||
            row.jenis_periode_tahun ||
            row.seleksi_periode ||
            '',
          namaSeleksi: jadwalMeta?.nama_seleksi || row.nama_seleksi || '',
          namaTilok: jadwalMeta?.nama_tilok || row.nama_tilok || '',
          instansiNama:
            Array.isArray(jadwalMeta?.instansi_list) && jadwalMeta.instansi_list.length > 0
              ? jadwalMeta.instansi_list
                  .map((i) => i.instansi_nama || i.nama || i.instansi_id)
                  .join(', ')
              : jadwalMeta?.instansi_nama || row.instansi_nama || '',
          tanggalMulai:
            jadwalMeta?.tanggal_mulai || row.jadwal_tanggal_mulai || row.tanggal_mulai || '',
          tanggalSelesai:
            jadwalMeta?.tanggal_selesai || row.jadwal_tanggal_selesai || row.tanggal_selesai || '',
          jadwalStDocumentId: jadwalMeta?.st_document_id ?? row.jadwal_st_document_id,
          jadwalNomorSt: jadwalMeta?.nomor_st || row.jadwal_nomor_st || '',
          jadwalTanggalSt: jadwalMeta?.tanggal_st || row.jadwal_tanggal_st || '',
          jadwalStStatus: jadwalMeta?.st_status || row.jadwal_st_status || 'menunggu',
          members: [],
        })
      }

      map.get(key).members.push(row)
    })

    return Array.from(map.values())
  }, [filteredRows, jadwalByIdMap])

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * pageSize
    return groupedJadwalRows.slice(start, start + pageSize)
  }, [groupedJadwalRows, page, pageSize])

  const activeDetailGroup = useMemo(() => {
    if (!detailModalKey) return null
    const matched = groupedJadwalRows.find((g) => g.key === detailModalKey)
    if (matched) return matched

    const fallbackJadwal = jadwalByIdMap.get(String(detailModalKey))
    if (!fallbackJadwal) return null

    const matchingRows = rows.filter(
      (r) => String(r.jadwal_id || r.jadwal_uid || r.nama_jadwal || r.id) === detailModalKey
    )
    return {
      key: detailModalKey,
      jadwalId: fallbackJadwal.id,
      jadwalUid: fallbackJadwal.uid || '',
      namaJadwal: fallbackJadwal.nama_jadwal || '-',
      jenisTesNama: fallbackJadwal.jenis_tes_nama || '',
      periode: fallbackJadwal.jenis_periode_tahun || fallbackJadwal.seleksi_periode || '',
      namaSeleksi: fallbackJadwal.nama_seleksi || '',
      namaTilok: fallbackJadwal.nama_tilok || '',
      instansiNama:
        Array.isArray(fallbackJadwal.instansi_list) && fallbackJadwal.instansi_list.length > 0
          ? fallbackJadwal.instansi_list
              .map((i) => i.instansi_nama || i.nama || i.instansi_id)
              .join(', ')
          : fallbackJadwal.instansi_nama || '',
      tanggalMulai: fallbackJadwal.tanggal_mulai || '',
      tanggalSelesai: fallbackJadwal.tanggal_selesai || '',
      jadwalStDocumentId: fallbackJadwal.st_document_id,
      jadwalNomorSt: fallbackJadwal.nomor_st || '',
      jadwalTanggalSt: fallbackJadwal.tanggal_st || '',
      jadwalStStatus: fallbackJadwal.st_status || 'menunggu',
      members: matchingRows,
    }
  }, [detailModalKey, groupedJadwalRows, jadwalByIdMap, rows])

  const kpis = useMemo(
    () => [
      {
        label: 'Total Penugasan',
        value: rows.length,
        unit: 'personel',
        context: `${categoryCounts.st_pending} menunggu ST (Menyusul)`,
        badge: 'Tim CAT',
        badgeColor: 'indigo',
        icon: Users,
      },
      {
        label: 'Koordinator',
        value: categoryCounts.Koordinator,
        unit: 'orang',
        context: 'Penanggung jawab titik lokasi',
        badge: 'Koordinator',
        badgeColor: 'purple',
        icon: ShieldCheck,
      },
      {
        label: 'Tim IT / Teknis',
        value: categoryCounts.IT,
        unit: 'orang',
        context: 'Dukungan server & jaringan CAT',
        badge: 'IT Support',
        badgeColor: 'blue',
        icon: Cpu,
      },
      {
        label: 'Pengawas Ujian',
        value: categoryCounts.Pengawas,
        unit: 'orang',
        context: 'Pengawasan ruang & sesi CAT',
        badge: 'Pengawas',
        badgeColor: 'emerald',
        icon: UserCheck,
      },
    ],
    [rows.length, categoryCounts]
  )

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteCatPengelolaTim(deletingItem.id)
      setDeletingItem(null)
      await loadData()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menghapus anggota tim.')
    } finally {
      setIsDeleting(false)
    }
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
        onClick={() => setViewMode('peta')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          viewMode === 'peta'
            ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>Kalender</span>
      </button>
    </div>
  )

  const hasActiveFilters = Boolean(
    unitKerjaFilter || jadwalIdFilter || searchTerm || activeCategory !== 'all'
  )

  const secondaryFilterControls = (
    <div className="flex flex-col md:flex-row md:items-center gap-2.5 w-full">
      <div className="w-full md:w-64 lg:w-72 shrink-0">
        <SearchableSelect
          options={unitKerjaOptions}
          value={unitKerjaFilter}
          isLoading={loadingMaster}
          placeholder="Semua Tim Kerja..."
          onChange={(val) => setUnitKerjaFilter(val || '')}
        />
      </div>

      <div className="w-full md:flex-1 min-w-0">
        <SearchableSelect
          options={jadwalSelectOptions}
          value={jadwalIdFilter}
          isLoading={loadingMaster}
          placeholder="Cari & pilih jadwal CAT..."
          onChange={handleChangeJadwalFilter}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setUnitKerjaFilter('')
            handleChangeJadwalFilter('')
            setSearchTerm('')
            setActiveCategory('all')
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 h-[38px] rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          title="Reset semua filter"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Manajemen Tim Fasilitasi CAT"
        description="Penetapan tim pelaksana (Koordinator, Tim IT, Pengawas) per jadwal kegiatan beserta peta sebaran tugas bulanan."
        onReload={loadData}
        isReloading={loading}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingMember(null)
              setModalPrefill(null)
              setModalJadwalId('')
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tugaskan Tim</span>
          </button>
        }
      />

      <PmaKpiGrid kpis={kpis} isLoading={loading} />

      {selectedJadwal && (
        <div className="bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
              {selectedJadwal.nama_jadwal}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
              <span>
                {selectedJadwal.jenis_tes_nama || '-'}
                {selectedJadwal.jenis_periode_tahun || selectedJadwal.seleksi_periode
                  ? ` • ${selectedJadwal.jenis_periode_tahun || selectedJadwal.seleksi_periode}`
                  : ''}
                {selectedJadwal.nama_seleksi ? ` • ${selectedJadwal.nama_seleksi}` : ''}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedJadwal.nama_tilok || '-'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {Array.isArray(selectedJadwal.instansi_list) && selectedJadwal.instansi_list.length > 0
                  ? selectedJadwal.instansi_list
                      .map((i) => i.instansi_nama || i.nama || i.instansi_id)
                      .join(', ')
                  : selectedJadwal.instansi_nama || 'Lintas / Umum'}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                {formatDateRangeId(selectedJadwal.tanggal_mulai, selectedJadwal.tanggal_selesai)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleChangeJadwalFilter('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Semua Jadwal</span>
          </button>
        </div>
      )}

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

      {/* Section Filter Toolbar Terpisah (Parity posisi toggle Tabel/Kalender dengan /pengelola/jadwal) */}
      <ServiceFilterToolbar
        showMonthFilter={false}
        showAllCategory={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        totalRecords={viewMode === 'table' ? groupedJadwalRows.length : filteredRows.length}
        categoryCounts={categoryCounts}
        extraControls={viewModeControls}
        secondaryFilters={secondaryFilterControls}
        placeholder="Cari nama pegawai, NIP, tim kerja, jadwal, atau tilok..."
      />

      {viewMode === 'peta' ? (
        <CatPengelolaTimMatrix
          timRows={filteredRows}
          pegawaiList={filteredPegawaiForMap}
          loading={loading || loadingMaster}
          selectedMonth={mapMonth}
          selectedYear={mapYear}
          onChangeMonth={setMapMonth}
          onChangeYear={setMapYear}
          onResetToday={() => {
            const now = new Date()
            setMapMonth(now.getMonth() + 1)
            setMapYear(now.getFullYear())
          }}
          onEditAssignment={(assignment) => {
            setModalPrefill(null)
            setEditingMember(assignment)
            setIsModalOpen(true)
          }}
          onQuickAssignDay={(prefill) => {
            setEditingMember(null)
            setModalPrefill(prefill)
            setIsModalOpen(true)
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nama Kegiatan / Jadwal</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tanggal Mulai</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tanggal Selesai</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Total Tim</th>
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
                            <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2.5 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4 text-center">
                        <div className="h-6 w-20 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="py-4 px-3.5 sm:px-4 text-right">
                        <div className="h-7 w-16 ml-auto bg-slate-100 dark:bg-slate-800 rounded-xl" />
                      </td>
                    </tr>
                  ))
                ) : paginatedGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Users className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Tidak Ada Jadwal Tim
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                        Belum ada kegiatan atau jadwal dengan penugasan tim yang sesuai dengan filter saat ini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedGroups.map((group) => {
                    const groupSubtitle = [
                      group.jenisTesNama,
                      group.periode,
                      group.namaTilok
                        ? group.namaTilok.replace(/^(titik\s*lokasi|tilok\s*lokasi)\s*[-:]\s*/i, '')
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')

                    return (
                      <tr
                        key={group.key}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[280px] xl:max-w-md">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <CalendarClock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2"
                                title={group.namaJadwal}
                              >
                                {group.namaJadwal}
                              </div>
                              {groupSubtitle && (
                                <div
                                  className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate"
                                  title={groupSubtitle}
                                >
                                  {groupSubtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatTanggalId(group.tanggalMulai)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatTanggalId(group.tanggalSelesai)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>{group.members.length} Orang</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalKey(group.key)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:border-[#175CD3]/40 hover:text-[#175CD3] dark:hover:bg-blue-950/40 dark:hover:text-blue-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
                            title="Lihat detail tim (Koordinator, IT, Pengawas) dan ubah data"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
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
              totalRecords={groupedJadwalRows.length}
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

      <CatPengelolaTimDetailModal
        isOpen={Boolean(activeDetailGroup)}
        group={activeDetailGroup}
        onClose={() => setDetailModalKey(null)}
        onAddMember={(targetJadwalId) => {
          setEditingMember(null)
          setModalPrefill(null)
          setModalJadwalId(targetJadwalId ? String(targetJadwalId) : '')
          setIsModalOpen(true)
        }}
        onEditMember={(member) => {
          setModalPrefill(null)
          setModalJadwalId('')
          setEditingMember(member)
          setIsModalOpen(true)
        }}
        onDeleteMember={(member) => setDeletingItem(member)}
        onLinkSt={(jadwalPayload) => setLinkingJadwal(jadwalPayload)}
      />

      <CatPengelolaTimModal
        isOpen={isModalOpen}
        defaultJadwalId={modalJadwalId || jadwalIdFilter}
        defaultPrefill={modalPrefill}
        editingMember={editingMember}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMember(null)
          setModalPrefill(null)
          setModalJadwalId('')
        }}
        onSuccess={loadData}
      />

      <CatPengelolaLinkStModal
        isOpen={Boolean(linkingJadwal)}
        jadwal={linkingJadwal}
        onClose={() => setLinkingJadwal(null)}
        onSuccess={loadData}
      />

      <CatPengelolaConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Hapus Personel dari Tim CAT"
        description={`Keluarkan "${deletingItem?.nama || ''}" (${getRoleMeta(deletingItem?.peran).label}) dari jadwal "${deletingItem?.nama_jadwal || ''}"?`}
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}

export default function FasilitasiCatPengelolaTimPage() {
  return (
    <CatPengelolaGateGuard>
      {() => <TimContent />}
    </CatPengelolaGateGuard>
  )
}
