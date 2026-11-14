import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Users,
  BarChart3,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Eye,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import {
  PENGELOLA_ROLES,
  getRoleMeta,
  ST_STATUS_META,
  formatDateRangeId,
  formatTanggalId,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  fetchCatPengelolaRekapPegawai,
  fetchCatMasterJenisTes,
} from '../../../services/api/sidigiCatServicesApi'
import { exportToXlsx } from '../../../utils/exportXlsxTable'

function ManajemenDataContent({ accessInfo }) {
  const [data, setData] = useState({
    jenis_tes_columns: [],
    available_years: [],
    rows: [],
    summary: {
      total_pegawai: 0,
      total_penugasan: 0,
      avg_per_pegawai: 0,
      max_penugasan: 0,
    },
  })
  const [jenisTesList, setJenisTesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [jenisTesFilter, setJenisTesFilter] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [peranFilter, setPeranFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [historyPegawai, setHistoryPegawai] = useState(null)
  const [roleCounts, setRoleCounts] = useState({})

  useEffect(() => {
    fetchCatMasterJenisTes('')
      .then((list) => setJenisTesList(Array.isArray(list) ? list : []))
      .catch(() => setJenisTesList([]))
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatPengelolaRekapPegawai({
        jenis_tes_id: jenisTesFilter,
        tahun: tahunFilter,
        peran: peranFilter,
      })
      const nextRows = Array.isArray(res?.rows) ? res.rows : []
      setData({
        jenis_tes_columns: Array.isArray(res?.jenis_tes_columns) ? res.jenis_tes_columns : [],
        available_years: Array.isArray(res?.available_years) ? res.available_years : [],
        rows: nextRows,
        summary: res?.summary || {
          total_pegawai: 0,
          total_penugasan: 0,
          avg_per_pegawai: 0,
          max_penugasan: 0,
        },
      })
      if (!peranFilter || peranFilter === 'all') {
        setRoleCounts({
          all: nextRows.length,
          Koordinator: nextRows.filter((r) => Number(r.count_koordinator || 0) > 0).length,
          IT: nextRows.filter((r) => Number(r.count_it || 0) > 0).length,
          Pengawas: nextRows.filter((r) => Number(r.count_pengawas || 0) > 0).length,
        })
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat rekap beban tugas pegawai.')
    } finally {
      setLoading(false)
    }
  }, [jenisTesFilter, tahunFilter, peranFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [jenisTesFilter, tahunFilter, peranFilter, searchTerm])

  const categories = useMemo(
    () => [
      { value: 'all', label: 'Semua' },
      ...PENGELOLA_ROLES.map((r) => ({ value: r.value, label: r.label })),
    ],
    []
  )

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return data.rows
    return data.rows.filter((r) =>
      [r.nama, r.nip, r.pangkat_gol, r.jabatan, r.last_tugas_tilok]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [data.rows, searchTerm])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const activeJenisCols = useMemo(() => {
    const cols = data.jenis_tes_columns || []
    if (jenisTesFilter) {
      return cols.filter((c) => String(c.id) === String(jenisTesFilter))
    }
    return cols
  }, [data.jenis_tes_columns, jenisTesFilter])

  const jenisTesOptions = useMemo(
    () =>
      jenisTesList.map((j) => ({
        value: String(j.id),
        label: j.kode ? `${j.nama} (${j.kode})` : j.nama,
      })),
    [jenisTesList]
  )

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const defaults = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(String)
    const fromApi = Array.isArray(data.available_years) ? data.available_years.map(String) : []
    return Array.from(new Set([...fromApi, ...defaults]))
      .filter((y) => /^\d{4}$/.test(y))
      .sort((a, b) => Number(b) - Number(a))
  }, [currentYear, data.available_years])

  const yearSelectOptions = useMemo(
    () =>
      yearOptions.map((y) => ({
        value: String(y),
        label: `Periode Tahun ${y}`,
      })),
    [yearOptions]
  )

  const activePeriodeLabel = tahunFilter ? `Periode ${tahunFilter}` : 'Semua Tahun'
  const hasActiveFilter = Boolean(
    jenisTesFilter || tahunFilter || peranFilter !== 'all' || searchTerm.trim()
  )

  const handleResetFilters = () => {
    setJenisTesFilter('')
    setTahunFilter('')
    setPeranFilter('all')
    setSearchTerm('')
  }

  const secondaryFilterControls = (
    <div className="flex flex-col md:flex-row md:items-center gap-2.5 w-full">
      <div className="w-full md:w-56 lg:w-64 shrink-0">
        <SearchableSelect
          options={yearSelectOptions}
          value={tahunFilter}
          placeholder="Semua Periode Tahun..."
          onChange={(val) => setTahunFilter(val || '')}
        />
      </div>

      <div className="w-full md:flex-1 min-w-0">
        <SearchableSelect
          options={jenisTesOptions}
          value={jenisTesFilter}
          placeholder="Cari & pilih Jenis Tes Besar..."
          onChange={(val) => setJenisTesFilter(val || '')}
        />
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center justify-center gap-1.5 px-3 h-[38px] rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          title="Reset semua filter"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )

  const kpis = useMemo(() => {
    const s = data.summary || {}
    return [
      {
        label: 'Pegawai Ditugaskan',
        value: Number(s.total_pegawai || 0),
        unit: 'pegawai',
        context: `${filteredRows.length} sesuai pencarian • ${activePeriodeLabel}`,
        badge: activePeriodeLabel,
        badgeColor: 'indigo',
        icon: Users,
      },
      {
        label: 'Total Penugasan',
        value: Number(s.total_penugasan || 0),
        unit: 'kali tugas',
        context: 'Akumulasi per Jenis Tes Besar (Koord, IT & Pengawas)',
        badge: 'Beban Kerja',
        badgeColor: 'emerald',
        icon: BarChart3,
      },
      {
        label: 'Rata-rata Tugas',
        value: Number(s.avg_per_pegawai || 0),
        unit: 'tugas/org',
        context: 'Indikator pemerataan pembagian tim',
        badge: 'Pemerataan',
        badgeColor: 'blue',
        icon: TrendingUp,
      },
      {
        label: 'Frekuensi Tertinggi',
        value: Number(s.max_penugasan || 0),
        unit: 'tugas',
        context: 'Jumlah penugasan terbanyak pada 1 pegawai',
        badge: 'Beban Maks',
        badgeColor: 'amber',
        icon: Award,
      },
    ]
  }, [data.summary, filteredRows.length, activePeriodeLabel])

  const handleExportXlsx = () => {
    const exportRows = filteredRows.map((row, idx) => {
      const periodeList = Array.isArray(row.periode_years) && row.periode_years.length > 0
        ? row.periode_years.join(', ')
        : tahunFilter || '-'
      const obj = {
        No: idx + 1,
        NIP: row.nip,
        Nama: row.nama,
        'Pangkat/Gol': row.pangkat_gol || '-',
        Jabatan: row.jabatan || '-',
        'Periode Tahun': periodeList,
        'Total Tugas': Number(row.total_tugas || 0),
        Koordinator: Number(row.count_koordinator || 0),
        'Tim IT': Number(row.count_it || 0),
        Pengawas: Number(row.count_pengawas || 0),
      }
      activeJenisCols.forEach((col) => {
        const entry = row.by_jenis_tes?.[String(col.id)]
        obj[col.kode || col.nama] = Number(entry?.total || 0)
      })
      obj['Tugas Terakhir'] = row.last_tugas_date
        ? `${formatTanggalId(row.last_tugas_date)} (${row.last_tugas_tilok || '-'})`
        : '-'
      return obj
    })

    exportToXlsx({
      filename: `Rekap_Penugasan_Tim_CAT_${tahunFilter || 'Semua'}.xlsx`,
      sheetName: 'Beban Tugas CAT',
      data: exportRows,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Manajemen Data & Rekap Beban Tugas Pegawai"
        description="Rekapitulasi frekuensi dan distribusi penugasan pegawai berdasarkan Jenis Tes Besar serta Periode Tahun."
        verifiedNip={accessInfo?.nip}
        onReload={loadData}
        isReloading={loading}
        actions={
          <button
            type="button"
            onClick={handleExportXlsx}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
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

      {/* Section Filter Toolbar Terpisah (Adopsi /layanan/fasilitasi-cat/pengelola/tim) */}
      <ServiceFilterToolbar
        showMonthFilter={false}
        showAllCategory={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        activeCategory={peranFilter}
        onCategoryChange={setPeranFilter}
        totalRecords={filteredRows.length}
        categoryCounts={roleCounts}
        secondaryFilters={secondaryFilterControls}
        placeholder="Cari nama pegawai, NIP, jabatan, atau lokasi terakhir..."
      />

      {/* Area Tabel Terpisah (Standar PEDOMAN_STANDARISASI_TABLE_MASTER.md) */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Pegawai
                </th>
                <th className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Periode Tahun
                </th>
                <th className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Total Tugas
                </th>
                {activeJenisCols.map((col) => (
                  <th
                    key={col.id}
                    className="py-3.5 px-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    title={`${col.nama} (Jenis Tes Besar)`}
                  >
                    {col.kode || col.nama}
                  </th>
                ))}
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Tugas Terakhir
                </th>
                <th className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 w-12 mx-auto rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 w-8 mx-auto rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    {activeJenisCols.map((col) => (
                      <td key={col.id} className="py-3.5 px-3 text-center">
                        <div className="h-4 w-6 mx-auto rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    ))}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-2.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-7 w-20 ml-auto rounded-lg bg-slate-200 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5 + activeJenisCols.length} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-1.5">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Belum ada data rekap penugasan
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Coba ubah filter Jenis Tes Besar, Periode Tahun, Peran, atau kata kunci pencarian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const periodeYears =
                    Array.isArray(row.periode_years) && row.periode_years.length > 0
                      ? row.periode_years
                      : tahunFilter
                        ? [tahunFilter]
                        : []

                  return (
                    <tr
                      key={row.nip}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-sky-950/50 text-[#175CD3] dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white leading-snug">
                              {row.nama}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              NIP {row.nip}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {row.jabatan || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-center tabular-nums">
                        {periodeYears.length > 0 ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {periodeYears.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap tabular-nums">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Number(row.total_tugas || 0)}x
                        </span>
                      </td>

                      {activeJenisCols.map((col) => {
                        const entry = row.by_jenis_tes?.[String(col.id)]
                        const cnt = Number(entry?.total || 0)
                        return (
                          <td
                            key={col.id}
                            className="py-3.5 px-3 align-top text-center tabular-nums whitespace-nowrap"
                          >
                            {cnt > 0 ? (
                              <span
                                className="font-semibold text-slate-800 dark:text-slate-100"
                                title={`${col.nama}: ${cnt} penugasan`}
                              >
                                {cnt}x
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                        )
                      })}

                      <td className="py-3.5 px-4 align-top">
                        <div className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatTanggalId(row.last_tugas_date)}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {row.last_tugas_tilok || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setHistoryPegawai(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-sky-950/40 text-[#175CD3] dark:text-sky-400 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                          title="Lihat Riwayat Penugasan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Riwayat</span>
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
            totalRecords={filteredRows.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            unitLabel="pegawai"
          />
        </div>
      </div>

      {/* Modal Detail Riwayat Penugasan Pegawai (Tabel) */}
      {historyPegawai && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-animated bg-slate-900/50 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryPegawai(null)
          }}
        >
          <div className="modal-dialog-animated w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Riwayat Penugasan: {historyPegawai.nama}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  NIP {historyPegawai.nip} • Total {historyPegawai.total_tugas} penugasan
                  {Array.isArray(historyPegawai.periode_years) && historyPegawai.periode_years.length > 0
                    ? ` • Periode ${historyPegawai.periode_years.join(', ')}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryPegawai(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto clean-scrollbar p-5">
              <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-x-auto clean-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5 whitespace-nowrap">No</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Peran</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap">Periode</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Jenis Tes &amp; Seleksi</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Tilok &amp; Instansi</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Tanggal Pelaksanaan</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Surat Tugas (ST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold">
                    {(historyPegawai.assignments || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                          Belum ada riwayat penugasan untuk pegawai ini.
                        </td>
                      </tr>
                    ) : (
                      (historyPegawai.assignments || []).map((asg, idx) => {
                        const roleMeta = getRoleMeta(asg.peran)
                        const stMeta = ST_STATUS_META[asg.st_status] || ST_STATUS_META.menunggu
                        const isStLinked = asg.st_status === 'terhubung'
                        return (
                          <tr
                            key={`${asg.jadwal_id}-${idx}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-3.5 align-top text-slate-500 tabular-nums whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3.5 align-top font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {roleMeta.label}
                            </td>
                            <td className="py-3 px-3.5 align-top text-center font-semibold text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                              {asg.periode_tahun || '-'}
                            </td>
                            <td className="py-3 px-3.5 align-top">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {asg.jenis_tes_nama || '-'}
                              </div>
                              {asg.nama_seleksi && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {asg.nama_seleksi}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 align-top">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {asg.nama_tilok || '-'}
                              </div>
                              {asg.instansi_nama && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {asg.instansi_nama}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 align-top text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatDateRangeId(asg.tanggal_mulai, asg.tanggal_selesai)}
                            </td>
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  isStLinked
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {asg.nomor_st || stMeta.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function FasilitasiCatPengelolaDataPage() {
  return (
    <CatPengelolaGateGuard>
      {({ accessInfo }) => <ManajemenDataContent accessInfo={accessInfo} />}
    </CatPengelolaGateGuard>
  )
}
