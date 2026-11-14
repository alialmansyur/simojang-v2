import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Users,
  FileStack,
  FileCheck2,
  BarChart3,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  JADWAL_STATUS_META,
  ST_STATUS_META,
  formatDateRangeId,
} from './pengelolaConstants'

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYmd(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function getStatusChipClass(status) {
  switch (status) {
    case 'draft':
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
    case 'selesai':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
    case 'batal':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50 line-through'
    case 'aktif':
    default:
      return 'bg-blue-50 text-[#175CD3] border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50'
  }
}

export function CatPengelolaJadwalCalendar({
  rows = [],
  loading = false,
  onCreateAtDate,
  onEdit,
  onDelete,
  onLinkSt,
  onOpenRekap,
  onOpenTim,
  onOpenDokumen,
}) {
  const todayStr = useMemo(() => toYmd(new Date()), [])

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [focusedRowUid, setFocusedRowUid] = useState('')

  // If filtered rows exist outside the initial empty month, focus the latest schedule month once
  const firstEventMonth = useMemo(() => {
    if (!rows.length) return null
    const sorted = [...rows]
      .filter((r) => r.tanggal_mulai)
      .sort((a, b) => String(b.tanggal_mulai).localeCompare(String(a.tanggal_mulai)))
    if (!sorted.length) return null
    return parseYmd(sorted[0].tanggal_mulai)
  }, [rows])

  useEffect(() => {
    setFocusedRowUid('')
  }, [rows])

  const monthLabel = useMemo(
    () =>
      viewMonth.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
    [viewMonth]
  )

  // Build Monday-first 6-week (42 cell) or 5-week calendar grid
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const lastOfMonth = new Date(year, month + 1, 0)

    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstOfMonth.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - startOffset)
    const totalNeeded = startOffset + lastOfMonth.getDate()
    const totalCells = totalNeeded <= 35 ? 35 : 42

    const days = []
    for (let i = 0; i < totalCells; i++) {
      const dateObj = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      )
      const dateStr = toYmd(dateObj)
      const inCurrentMonth = dateObj.getMonth() === month
      const dayEvents = rows.filter((r) => {
        const start = r.tanggal_mulai ? String(r.tanggal_mulai).slice(0, 10) : ''
        const end = r.tanggal_selesai ? String(r.tanggal_selesai).slice(0, 10) : start
        if (!start) return false
        return dateStr >= start && dateStr <= (end || start)
      })
      days.push({
        date: dateObj,
        dateStr,
        dayNum: dateObj.getDate(),
        inCurrentMonth,
        isToday: dateStr === todayStr,
        events: dayEvents,
      })
    }
    return days
  }, [viewMonth, rows, todayStr])

  const monthEventsCount = useMemo(() => {
    const y = viewMonth.getFullYear()
    const m = String(viewMonth.getMonth() + 1).padStart(2, '0')
    const monthStart = `${y}-${m}-01`
    const monthEnd = `${y}-${m}-31`
    return rows.filter((r) => {
      const start = r.tanggal_mulai ? String(r.tanggal_mulai).slice(0, 10) : ''
      const end = r.tanggal_selesai ? String(r.tanggal_selesai).slice(0, 10) : start
      if (!start) return false
      return start <= monthEnd && (end || start) >= monthStart
    }).length
  }, [viewMonth, rows])

  const selectedDayEvents = useMemo(() => {
    return rows.filter((r) => {
      const start = r.tanggal_mulai ? String(r.tanggal_mulai).slice(0, 10) : ''
      const end = r.tanggal_selesai ? String(r.tanggal_selesai).slice(0, 10) : start
      if (!start) return false
      return selectedDate >= start && selectedDate <= (end || start)
    })
  }, [rows, selectedDate])

  const selectedDateFormatted = useMemo(() => {
    const d = parseYmd(selectedDate)
    if (!d) return selectedDate
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDate])

  const handlePrevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToday = () => {
    const now = new Date()
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(todayStr)
  }

  const handleJumpFirstEvent = () => {
    if (!firstEventMonth) return
    setViewMonth(new Date(firstEventMonth.getFullYear(), firstEventMonth.getMonth(), 1))
    setSelectedDate(toYmd(firstEventMonth))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
      {/* Calendar Grid Card */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white capitalize min-w-[140px] text-center">
              {monthLabel}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="ml-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
          </div>

          {/* Status Legend + Quick Jump */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {monthEventsCount === 0 && firstEventMonth && (
              <button
                type="button"
                onClick={handleJumpFirstEvent}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-300 font-semibold transition-colors cursor-pointer"
              >
                Loncat ke{' '}
                {firstEventMonth.toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric',
                })}
              </button>
            )}
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#175CD3]" /> Aktif
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Draft
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Batal
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs sm:text-sm text-slate-500">
            Memuat kalender jadwal kegiatan CAT...
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAY_HEADERS.map((day, idx) => (
                <div
                  key={day}
                  className={`py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider ${
                    idx >= 5
                      ? 'text-rose-500/80 dark:text-rose-400/80'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 7-Column Date Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((cell) => {
                const isSelected = cell.dateStr === selectedDate
                const visibleEvents = cell.events.slice(0, 3)
                const overflowCount = cell.events.length - visibleEvents.length

                return (
                  <div
                    key={cell.dateStr}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedDate(cell.dateStr)
                      setFocusedRowUid('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedDate(cell.dateStr)
                      }
                    }}
                    className={`min-h-[82px] sm:min-h-[104px] rounded-xl p-1.5 border text-left transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-[#175CD3] ring-2 ring-[#175CD3]/15 bg-blue-50/30 dark:bg-blue-950/20'
                        : cell.inCurrentMonth
                        ? 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-semibold tabular-nums ${
                          cell.isToday
                            ? 'bg-[#175CD3] text-white'
                            : isSelected
                            ? 'text-[#175CD3] dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {cell.events.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 tabular-nums px-1">
                          {cell.events.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 overflow-hidden">
                      {visibleEvents.map((ev) => (
                        <button
                          key={`${cell.dateStr}-${ev.uid || ev.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDate(cell.dateStr)
                            setFocusedRowUid(String(ev.uid || ev.id))
                          }}
                          className={`w-full text-left px-1.5 py-0.5 rounded-md border text-[10px] font-medium truncate transition-opacity hover:opacity-85 cursor-pointer ${getStatusChipClass(
                            ev.status
                          )}`}
                          title={`${ev.nama_jadwal || ev.nama_seleksi || 'Jadwal CAT'} (${
                            ev.nama_tilok || '-'
                          })`}
                        >
                          {ev.nama_jadwal || ev.nama_seleksi || 'Jadwal CAT'}
                        </button>
                      ))}
                      {overflowCount > 0 && (
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                          +{overflowCount} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Date Agenda Side Panel */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Agenda Tanggal Terpilih
            </p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {selectedDateFormatted}
            </h4>
          </div>
          {onCreateAtDate && (
            <button
              type="button"
              onClick={() => onCreateAtDate(selectedDate)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
              title="Buat jadwal pada tanggal ini"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jadwal</span>
            </button>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-[540px] overflow-y-auto clean-scrollbar">
          {selectedDayEvents.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Tidak ada jadwal kegiatan CAT pada tanggal ini.
              </p>
              <p className="text-[11px] text-slate-400">
                Klik tanggal lain di kalender atau tekan tombol + Jadwal untuk menambahkan.
              </p>
            </div>
          ) : (
            selectedDayEvents.map((row) => {
              const statusMeta = JADWAL_STATUS_META[row.status] || JADWAL_STATUS_META.aktif
              const stMeta = ST_STATUS_META[row.st_status] || ST_STATUS_META.menunggu
              const isFocused = focusedRowUid === String(row.uid || row.id)
              const instansiNames =
                Array.isArray(row.instansi_list) && row.instansi_list.length > 0
                  ? row.instansi_list
                      .map((i) => i.instansi_nama || i.nama || i.instansi_id)
                      .join(', ')
                  : row.instansi_nama || 'Lintas / Umum (Opsional)'

              return (
                <div
                  key={row.uid || row.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                    isFocused
                      ? 'border-[#175CD3] bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {row.nama_jadwal || row.nama_seleksi || 'Jadwal CAT'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.jenis_tes_nama || '-'}
                        {row.jenis_periode_tahun || row.seleksi_periode
                          ? ` • ${row.jenis_periode_tahun || row.seleksi_periode}`
                          : ''}
                        {row.nama_seleksi ? ` • ${row.nama_seleksi}` : ''}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateRangeId(row.tanggal_mulai, row.tanggal_selesai)}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {row.nama_tilok || 'Tilok belum dipilih'}
                        </span>
                        <span className="text-slate-400"> — {instansiNames}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stMeta.badgeClass}`}
                      >
                        {row.st_status === 'terhubung' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="max-w-[110px] truncate">
                          {row.st_status === 'terhubung' && (row.resolved_nomor_st || row.nomor_st)
                            ? row.resolved_nomor_st || row.nomor_st
                            : stMeta.label}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenTim?.(row)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-semibold cursor-pointer"
                        title="Tim Pelaksana"
                      >
                        <Users className="w-3 h-3" />
                        {Number(row.total_tim || 0)}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDokumen?.(row)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 text-[10px] font-semibold cursor-pointer"
                        title="Dokumen Pendukung"
                      >
                        <FileStack className="w-3 h-3" />
                        {Number(row.total_dokumen || 0)}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLinkSt?.(row)}
                        className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer"
                        title="Tautkan Nomor ST"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRekap?.(row)}
                        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 cursor-pointer"
                        title="Buka di Rekapitulasi CAT"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit?.(row)}
                        className="p-1 rounded-lg text-[#175CD3] hover:bg-blue-50 dark:text-sky-400 dark:hover:bg-sky-950/40 cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(row)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
