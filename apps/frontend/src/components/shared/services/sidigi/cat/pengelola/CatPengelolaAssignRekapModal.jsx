import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Link2,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react'
import { fetchCatSessions } from '../../../../../../services/api/sidigiCatServicesApi'
import { formatDateRangeId, formatTanggalId } from './pengelolaConstants'

export function CatPengelolaAssignRekapModal({
  isOpen,
  onClose,
  jadwal,
  onOpenRekapData,
}) {
  if (!isOpen || !jadwal) return null
  return (
    <CatPengelolaAssignRekapContent
      onClose={onClose}
      jadwal={jadwal}
      onOpenRekapData={onOpenRekapData}
    />
  )
}

function CatPengelolaAssignRekapContent({ onClose, jadwal, onOpenRekapData }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'in_range' | 'out_range'

  const tilokKey = jadwal.tilok_uid || jadwal.tilok_id
  const seleksiId = jadwal.seleksi_id

  const loadSessions = useCallback(async () => {
    if (!tilokKey) {
      setSessions([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatSessions({
        tilokUid: tilokKey,
        seleksiId: seleksiId || '',
        length: 200,
      })
      const list = Array.isArray(res?.data) ? res.data : []
      setSessions(list)

      // Default checklist: tandai semua sesi yang tanggalnya masuk rentang jadwal
      const defaultChecked = new Set()
      list.forEach((s) => {
        const sDate = s.period_date || s.tanggal || ''
        const isInRange =
          (!jadwal.tanggal_mulai || sDate >= jadwal.tanggal_mulai) &&
          (!jadwal.tanggal_selesai || sDate <= jadwal.tanggal_selesai)
        if (isInRange) {
          defaultChecked.add(s.id || s.uid)
        }
      })
      setSelectedIds(defaultChecked)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat rekap sesi dari lapangan.')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [tilokKey, seleksiId, jadwal.tanggal_mulai, jadwal.tanggal_selesai])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Hitung summary sesi yang terdeteksi
  const stats = useMemo(() => {
    let inRangeCount = 0
    let totalPeserta = 0
    let totalHadir = 0
    let totalTidakHadir = 0

    sessions.forEach((s) => {
      const sDate = s.period_date || s.tanggal || ''
      const isInRange =
        (!jadwal.tanggal_mulai || sDate >= jadwal.tanggal_mulai) &&
        (!jadwal.tanggal_selesai || sDate <= jadwal.tanggal_selesai)
      if (isInRange) inRangeCount++
      totalPeserta += Number(s.hadir || 0) + Number(s.tidak_hadir || 0)
      totalHadir += Number(s.hadir || 0)
      totalTidakHadir += Number(s.tidak_hadir || 0)
    })

    return {
      total: sessions.length,
      inRangeCount,
      totalPeserta,
      totalHadir,
      totalTidakHadir,
    }
  }, [sessions, jadwal.tanggal_mulai, jadwal.tanggal_selesai])

  // Filter list sesi
  const filteredSessions = useMemo(() => {
    let list = sessions
    if (dateFilter === 'in_range') {
      list = list.filter((s) => {
        const d = s.period_date || s.tanggal || ''
        return (
          (!jadwal.tanggal_mulai || d >= jadwal.tanggal_mulai) &&
          (!jadwal.tanggal_selesai || d <= jadwal.tanggal_selesai)
        )
      })
    } else if (dateFilter === 'out_range') {
      list = list.filter((s) => {
        const d = s.period_date || s.tanggal || ''
        return (
          (jadwal.tanggal_mulai && d < jadwal.tanggal_mulai) ||
          (jadwal.tanggal_selesai && d > jadwal.tanggal_selesai)
        )
      })
    }

    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((s) =>
        [s.instansi_nama, s.sesi, s.period_date, s.created_by]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }

    return list
  }, [sessions, dateFilter, searchTerm, jadwal.tanggal_mulai, jadwal.tanggal_selesai])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSessions.length && filteredSessions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredSessions.map((s) => s.id || s.uid)))
    }
  }

  // Keyboard shortcut escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-900/40">
                <Link2 className="w-3.5 h-3.5" />
                <span>Lihat & Tautkan Rekap Lapangan</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Jadwal: {jadwal.nama_jadwal}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {jadwal.nama_seleksi} — {jadwal.nama_tilok}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Periode Jadwal:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {formatDateRangeId(jadwal.tanggal_mulai, jadwal.tanggal_selesai)}
                </strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Tilok: <strong>{jadwal.nama_tilok || '-'}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Insight KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:px-5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 text-xs shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Sesi Tercatat
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {stats.total} Sesi
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Cocok Rentang Tanggal
            </span>
            <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.inRangeCount} Sesi
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Hadir
            </span>
            <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
              {stats.totalHadir.toLocaleString('id-ID')} Peserta
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Tidak Hadir
            </span>
            <div className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
              {stats.totalTidakHadir.toLocaleString('id-ID')} Peserta
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari instansi, tanggal, sesi, atau petugas..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('in_range')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'in_range'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Dalam Rentang ({stats.inRangeCount})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('out_range')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'out_range'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Di Luar Rentang ({sessions.length - stats.inRangeCount})
              </button>
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {selectedIds.size === filteredSessions.length && filteredSessions.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Pilih Semua</span>
            </button>
          </div>
        </div>

        {/* Tabel Sesi Lapangan */}
        <div className="flex-1 overflow-y-auto clean-scrollbar p-3 sm:px-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span>Memuat data rekap sesi dari lapangan...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <AlertCircle className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Belum ada rekap sesi lapangan yang tercatat di tilok ini.
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Petugas lapangan dapat menginput rekap sesi secara berkala melalui menu{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  /layanan/fasilitasi-cat/rekap-data
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-10">Pilih</th>
                    <th className="py-2.5 px-3">Tanggal & Sesi</th>
                    <th className="py-2.5 px-3">Instansi Peserta</th>
                    <th className="py-2.5 px-3 text-center">Hadir</th>
                    <th className="py-2.5 px-3 text-center">Tdk Hadir</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3">Petugas Input</th>
                    <th className="py-2.5 px-3 text-center">Kesesuaian Jadwal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSessions.map((row) => {
                    const sid = row.id || row.uid
                    const isChecked = selectedIds.has(sid)
                    const sDate = row.period_date || row.tanggal || ''
                    const isInRange =
                      (!jadwal.tanggal_mulai || sDate >= jadwal.tanggal_mulai) &&
                      (!jadwal.tanggal_selesai || sDate <= jadwal.tanggal_selesai)
                    const totalSesi = Number(row.hadir || 0) + Number(row.tidak_hadir || 0)

                    return (
                      <tr
                        key={sid}
                        onClick={() => toggleSelect(sid)}
                        className={`transition-colors cursor-pointer select-none ${
                          isChecked
                            ? 'bg-blue-50/40 dark:bg-blue-950/20'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(sid)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {formatTanggalId(sDate)}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                            Sesi {row.sesi}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {row.instansi_nama || `Instansi ${row.instansi_id}`}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          {Number(row.hadir || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                          {Number(row.tidak_hadir || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {totalSesi.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {row.created_by || 'Petugas CAT'}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isInRange ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sesuai Jadwal</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                              <AlertCircle className="w-3 h-3" />
                              <span>Di Luar Tanggal</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-5 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              <strong>{selectedIds.size} sesi</strong> terpilih untuk ditautkan / dievaluasi terhadap
              jadwal ini.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRekapData && (
              <button
                type="button"
                onClick={() => onOpenRekapData(jadwal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Buka halaman Rekap Data Sesi dengan filter jadwal ini"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Rekap Sesi Harian</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Selesai Meninjau
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
