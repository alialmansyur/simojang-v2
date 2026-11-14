import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarRange, Users } from 'lucide-react'
import { formatDateRangeId } from './pengelolaConstants'

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function toYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Split month days [1..daysInMonth] cleanly into contiguous segments for a given employee's assignments.
 * Adjacent/continuous multi-day tasks become a single colSpan cell; empty days remain 1-day cells.
 */
function buildEmployeeMonthSegments(assignments, year, month, daysInMonth) {
  const monthStart = toYmd(year, month, 1)
  const monthEnd = toYmd(year, month, daysInMonth)

  const clamped = assignments
    .map((a) => {
      const rawStart = String(a.tanggal_mulai || a.jadwal_tanggal_mulai || '').slice(0, 10)
      const rawEnd = String(a.tanggal_selesai || a.jadwal_tanggal_selesai || rawStart).slice(0, 10)
      if (!rawStart) return null
      if (rawEnd < monthStart || rawStart > monthEnd) return null
      const effStart = rawStart < monthStart ? monthStart : rawStart
      const effEnd = rawEnd > monthEnd ? monthEnd : rawEnd
      const startDay = Number(effStart.slice(8, 10))
      const endDay = Number(effEnd.slice(8, 10))
      if (!startDay || !endDay || endDay < startDay) return null
      return {
        ...a,
        clampedStart: startDay,
        clampedEnd: endDay,
      }
    })
    .filter(Boolean)

  if (clamped.length === 0) {
    const emptyCells = []
    for (let d = 1; d <= daysInMonth; d++) {
      emptyCells.push({ startDay: d, endDay: d, colSpan: 1, items: [] })
    }
    return emptyCells
  }

  const cutSet = new Set([1, daysInMonth + 1])
  clamped.forEach((c) => {
    cutSet.add(c.clampedStart)
    cutSet.add(c.clampedEnd + 1)
  })
  const cuts = Array.from(cutSet).sort((a, b) => a - b)

  const segments = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const segStart = cuts[i]
    const segEnd = cuts[i + 1] - 1
    if (segStart > segEnd) continue

    const covering = clamped.filter((c) => c.clampedStart <= segStart && c.clampedEnd >= segEnd)
    if (covering.length === 0) {
      // Split empty gaps into single-day columns so vertical day borders remain crisp & clickable
      for (let d = segStart; d <= segEnd; d++) {
        segments.push({ startDay: d, endDay: d, colSpan: 1, items: [] })
      }
    } else {
      segments.push({
        startDay: segStart,
        endDay: segEnd,
        colSpan: segEnd - segStart + 1,
        items: covering,
      })
    }
  }

  return segments
}

export function CatPengelolaTimMatrix({
  timRows = [],
  pegawaiList = [],
  loading = false,
  selectedMonth,
  selectedYear,
  onChangeMonth,
  onChangeYear,
  onResetToday,
  onEditAssignment,
  onQuickAssignDay,
}) {
  const [onlyAssigned, setOnlyAssigned] = useState(false)

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth, 0).getDate(),
    [selectedYear, selectedMonth]
  )

  const today = useMemo(() => {
    const now = new Date()
    return {
      y: now.getFullYear(),
      m: now.getMonth() + 1,
      d: now.getDate(),
    }
  }, [])

  const dayColumns = useMemo(() => {
    const cols = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(selectedYear, selectedMonth - 1, d)
      const dow = dt.getDay()
      cols.push({
        day: d,
        dayName: SHORT_DAYS[dow],
        isWeekend: dow === 0 || dow === 6,
        isToday: selectedYear === today.y && selectedMonth === today.m && d === today.d,
        dateStr: toYmd(selectedYear, selectedMonth, d),
      })
    }
    return cols
  }, [daysInMonth, selectedYear, selectedMonth, today])

  const yearOptions = useMemo(() => {
    const curr = new Date().getFullYear()
    const years = []
    for (let y = curr - 3; y <= curr + 2; y++) {
      years.push(y)
    }
    return years
  }, [])

  // Group assignments by NIP
  const assignmentsByNip = useMemo(() => {
    const map = new Map()
    timRows.forEach((row) => {
      const nip = String(row.nip || '').trim()
      if (!nip) return
      if (!map.has(nip)) map.set(nip, [])
      map.get(nip).push(row)
    })
    return map
  }, [timRows])

  // Merge base pegawaiList + any assigned members from timRows not in pegawaiList
  const matrixEmployees = useMemo(() => {
    const byNip = new Map()

    pegawaiList.forEach((p) => {
      const nip = String(p.nip || '').trim()
      if (!nip) return
      byNip.set(nip, {
        nip,
        nama: p.nama || '-',
        jabatan: p.jabatan || '',
        unit_kerja_id: p.unit_kerja_id || '',
        unit_kerja_nama: p.unit_kerja_nama || '',
      })
    })

    timRows.forEach((r) => {
      const nip = String(r.nip || '').trim()
      if (!nip) return
      if (byNip.has(nip)) {
        const existing = byNip.get(nip)
        if (!existing.jabatan && (r.pegawai_jabatan || r.jabatan)) {
          existing.jabatan = r.pegawai_jabatan || r.jabatan || ''
        }
        return
      }
      byNip.set(nip, {
        nip,
        nama: r.nama || '-',
        jabatan: r.pegawai_jabatan || r.jabatan || '',
        unit_kerja_id: r.unit_kerja_id || '',
        unit_kerja_nama: r.unit_kerja_nama || '',
      })
    })

    let list = Array.from(byNip.values())

    const monthStart = toYmd(selectedYear, selectedMonth, 1)
    const monthEnd = toYmd(selectedYear, selectedMonth, daysInMonth)

    list = list.map((emp) => {
      const empAssignments = assignmentsByNip.get(emp.nip) || []
      const monthAssignments = empAssignments.filter((a) => {
        const s = String(a.tanggal_mulai || a.jadwal_tanggal_mulai || '').slice(0, 10)
        const e = String(a.tanggal_selesai || a.jadwal_tanggal_selesai || s).slice(0, 10)
        if (!s) return false
        return s <= monthEnd && e >= monthStart
      })
      const segments = buildEmployeeMonthSegments(
        monthAssignments,
        selectedYear,
        selectedMonth,
        daysInMonth
      )
      return {
        ...emp,
        monthAssignments,
        segments,
      }
    })

    if (onlyAssigned) {
      list = list.filter((emp) => emp.monthAssignments.length > 0)
    }

    // Put employees with assignments in this month slightly easier to scan? No: sort alphabetically or assigned first cleanly
    list.sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'))

    return list
  }, [pegawaiList, timRows, assignmentsByNip, selectedYear, selectedMonth, daysInMonth, onlyAssigned])

  const totalBusyPegawai = useMemo(
    () => matrixEmployees.filter((e) => e.monthAssignments.length > 0).length,
    [matrixEmployees]
  )

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onChangeYear(selectedYear - 1)
      onChangeMonth(12)
    } else {
      onChangeMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onChangeYear(selectedYear + 1)
      onChangeMonth(1)
    } else {
      onChangeMonth(selectedMonth + 1)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
      {/* Period Navigation & Legend Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <CalendarRange className="w-4 h-4 text-[#175CD3] dark:text-blue-400" />
            <span>Periode Peta:</span>
          </div>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => onChangeMonth(Number(e.target.value))}
            className="h-8 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => onChangeYear(Number(e.target.value))}
            className="h-8 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onResetToday}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Bulan Berjalan
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="w-3.5 h-3.5 rounded bg-emerald-400/90 border border-emerald-500/60 inline-block" />
            Sedang Tugas ({totalBusyPegawai} dari {matrixEmployees.length} pegawai)
          </span>

          <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAssigned}
              onChange={(e) => setOnlyAssigned(e.target.checked)}
              className="rounded border-slate-300 text-[#175CD3] focus:ring-[#175CD3]"
            />
            <span>Hanya yang bertugas bulan ini</span>
          </label>
        </div>
      </div>

      {/* Horizontal Scroll Timeline Matrix (1..daysInMonth) */}
      <div className="overflow-x-auto clean-scrollbar">
        <table className="w-max min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 py-2.5 px-2 text-center border-r border-slate-200/70 dark:border-slate-700 w-[44px] min-w-[44px] max-w-[44px]">
                No
              </th>
              <th className="sticky left-[44px] z-20 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-left border-r border-slate-200/70 dark:border-slate-700 w-[155px] min-w-[155px] max-w-[155px]">
                NIP
              </th>
              <th className="sticky left-[199px] z-20 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-left border-r border-slate-200/70 dark:border-slate-700 w-[200px] min-w-[200px] max-w-[200px]">
                Nama Pegawai
              </th>
              <th className="sticky left-[399px] z-20 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-left border-r-2 border-slate-300/80 dark:border-slate-700 w-[180px] min-w-[180px] max-w-[180px]">
                Jabatan / Tim Kerja
              </th>
              {dayColumns.map((col) => (
                <th
                  key={col.day}
                  className={`py-1.5 px-1 text-center border-r border-slate-200/60 dark:border-slate-800 w-[38px] min-w-[38px] tabular-nums ${
                    col.isToday
                      ? 'bg-blue-100/80 text-[#175CD3] dark:bg-blue-950/60 dark:text-blue-300'
                      : col.isWeekend
                      ? 'bg-slate-100/80 text-rose-500 dark:bg-slate-800/90 dark:text-rose-400'
                      : ''
                  }`}
                >
                  <div className="leading-none">{col.day}</div>
                  <div className="text-[9px] font-normal opacity-75 mt-0.5">{col.dayName}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={4 + daysInMonth} className="py-14 text-center text-slate-500">
                  Memuat peta jadwal penugasan tim CAT...
                </td>
              </tr>
            ) : matrixEmployees.length === 0 ? (
              <tr>
                <td colSpan={4 + daysInMonth} className="py-14 text-center text-slate-500">
                  <div className="inline-flex flex-col items-center gap-1.5">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span>Tidak ada data pegawai sesuai filter Tim Kerja atau kata kunci saat ini.</span>
                  </div>
                </td>
              </tr>
            ) : (
              matrixEmployees.map((emp, idx) => (
                <tr
                  key={emp.nip}
                  className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 py-2 px-2 text-center text-[11px] font-medium text-slate-500 border-r border-slate-200/70 dark:border-slate-800 tabular-nums w-[44px] min-w-[44px] max-w-[44px]">
                    {idx + 1}
                  </td>
                  <td className="sticky left-[44px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 py-2 px-3 text-[11px] font-mono text-slate-600 dark:text-slate-300 border-r border-slate-200/70 dark:border-slate-800 whitespace-nowrap truncate w-[155px] min-w-[155px] max-w-[155px]">
                    {emp.nip}
                  </td>
                  <td
                    className="sticky left-[199px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200/70 dark:border-slate-800 w-[200px] min-w-[200px] max-w-[200px] truncate"
                    title={emp.nama}
                  >
                    {emp.nama}
                  </td>
                  <td
                    className="sticky left-[399px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 py-2 px-3 border-r-2 border-slate-300/80 dark:border-slate-700 w-[180px] min-w-[180px] max-w-[180px]"
                    title={[emp.jabatan, emp.unit_kerja_nama].filter(Boolean).join(' • ')}
                  >
                    <div className="truncate font-medium text-slate-700 dark:text-slate-200">
                      {emp.jabatan || '-'}
                    </div>
                    {emp.unit_kerja_nama && (
                      <div className="text-[10px] font-normal text-slate-400 truncate">
                        {emp.unit_kerja_nama}
                      </div>
                    )}
                  </td>

                  {/* Date Range Grid Cells */}
                  {emp.segments.map((seg) => {
                    if (seg.items.length === 0) {
                      const colMeta = dayColumns[seg.startDay - 1]
                      return (
                        <td
                          key={`${emp.nip}-d${seg.startDay}`}
                          onClick={() =>
                            onQuickAssignDay?.({
                              nip: emp.nip,
                              nama: emp.nama,
                              jabatan: emp.jabatan,
                              unit_kerja_nama: emp.unit_kerja_nama,
                              unitKerjaId: emp.unit_kerja_id,
                              tanggalMulai: colMeta?.dateStr || '',
                              tanggalSelesai: colMeta?.dateStr || '',
                            })
                          }
                          title={`Kosong • Klik untuk menugaskan ${emp.nama} pada ${colMeta?.dateStr}`}
                          className={`border-r border-slate-100 dark:border-slate-800/70 h-10 cursor-pointer hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors ${
                            colMeta?.isToday
                              ? 'bg-blue-50/30 dark:bg-blue-950/15'
                              : colMeta?.isWeekend
                              ? 'bg-slate-50/70 dark:bg-slate-800/20'
                              : ''
                          }`}
                        />
                      )
                    }

                    const primary = seg.items[0]
                    const tooltipText = seg.items
                      .map(
                        (item) =>
                          `${item.nama_jadwal || item.nama_seleksi || 'Tugas CAT'} | ${
                            item.nama_tilok || '-'
                          } (${formatDateRangeId(
                            item.tanggal_mulai || item.jadwal_tanggal_mulai,
                            item.tanggal_selesai || item.jadwal_tanggal_selesai
                          )})`
                      )
                      .join('\n')

                    return (
                      <td
                        key={`${emp.nip}-seg-${seg.startDay}-${seg.endDay}`}
                        colSpan={seg.colSpan}
                        className="p-0.5 border-r border-emerald-400/50 dark:border-emerald-700/60 align-middle"
                      >
                        {seg.items.length === 1 ? (
                          <button
                            type="button"
                            onClick={() => onEditAssignment?.(primary)}
                            title={tooltipText}
                            className="w-full h-8 px-1.5 rounded-md bg-emerald-400/90 hover:bg-emerald-500 text-emerald-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white border border-emerald-500/60 text-[10px] font-semibold truncate flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                          >
                            <span className="truncate">
                              {primary.nama_tilok || primary.nama_jadwal || 'Tugas CAT'}
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-0.5">
                            {seg.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onEditAssignment?.(item)}
                                title={tooltipText}
                                className="w-full h-5 px-1 rounded bg-emerald-400/90 hover:bg-emerald-500 text-emerald-950 dark:bg-emerald-600 dark:text-white text-[9px] font-semibold truncate block text-center cursor-pointer"
                              >
                                {item.nama_tilok || item.nama_jadwal || 'Tugas CAT'}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
