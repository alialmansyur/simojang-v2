import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isEventOnDate } from '../../../services/api/eventsApi'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function parseLocalYmd(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  return new Date(y, m - 1, d)
}

function toLocalYmd(date) {
  return date.toLocaleDateString('en-CA')
}

function addDays(date, offset) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + offset)
  return next
}

export default function CalendarWidget({
  events = [],
  selectedDate,
  onSelectDate,
  maxDate,
}) {
  const effectiveMaxDate = maxDate || toLocalYmd(new Date())

  const [windowStart, setWindowStart] = useState(() => {
    const maxD = parseLocalYmd(effectiveMaxDate)
    const selD = selectedDate ? parseLocalYmd(selectedDate) : maxD
    const anchor = selD > maxD ? maxD : selD
    return addDays(anchor, -6)
  })

  // Generate up to 7 days strictly on or before effectiveMaxDate (today)
  const stripDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(windowStart, i)
      const dateStr = toLocalYmd(d)
      if (dateStr > effectiveMaxDate) continue
      const dayName = DAY_NAMES[d.getDay()]
      const dayNum = d.getDate()
      const hasEvents = events.some((e) => isEventOnDate(e, dateStr))
      days.push({
        date: d,
        dateStr,
        dayName,
        dayNum,
        hasEvents,
      })
    }
    return days
  }, [windowStart, events, effectiveMaxDate])

  const isNextDisabled = useMemo(() => {
    const windowEndStr = toLocalYmd(addDays(windowStart, 6))
    return windowEndStr >= effectiveMaxDate
  }, [windowStart, effectiveMaxDate])

  // Current Month/Year label
  const monthYearLabel = useMemo(() => {
    const ref = selectedDate
      ? parseLocalYmd(selectedDate)
      : (stripDays[stripDays.length - 1]?.date || parseLocalYmd(effectiveMaxDate))
    return ref.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }, [selectedDate, stripDays, effectiveMaxDate])

  // Navigation handlers
  const handlePrevWeek = () => {
    setWindowStart((prev) => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setWindowStart((prev) => {
      const maxStart = addDays(parseLocalYmd(effectiveMaxDate), -6)
      const candidate = addDays(prev, 7)
      return candidate > maxStart ? maxStart : candidate
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs font-sans transition-all">
      {/* Header Matching Screenshot 1 */}
      <div className="flex items-center justify-between gap-3 font-sans">
        <div>
          <h3 className="text-base font-bold text-[#0B3264] dark:text-white font-sans flex items-center gap-2">
            Kalender Kegiatan
          </h3>
          <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">
            Pilih tanggal untuk melihat jadwal
          </p>
        </div>

        {/* Month/Year pill badge */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-[#EAF2FC] text-[#0B3264] dark:bg-[#0B3264]/30 dark:text-[#93C5FD] text-xs font-bold capitalize font-sans shadow-2xs select-none">
          {monthYearLabel}
        </div>
      </div>

      {/* Horizontal Date Strip (Exact Match to Reference Screenshot) */}
      <div className="flex items-center justify-between gap-1.5 pt-1 font-sans">
        {/* Prev week button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handlePrevWeek}
          className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-[#EAF2FC] hover:text-[#0B3264] dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
          title="Minggu Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* 7 Days Strip */}
        <div className="flex items-center justify-between flex-1 gap-1">
          {stripDays.map((item) => {
            const isSelected = item.dateStr === selectedDate

            return (
              <motion.button
                key={item.dateStr}
                whileHover={{ y: isSelected ? 0 : -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl transition-all cursor-pointer relative min-w-[42px] font-sans ${
                  isSelected
                    ? 'bg-action text-white shadow-sm ring-2 ring-action/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#EAF2FC]/70 dark:hover:bg-slate-800/80'
                }`}
              >
                {/* Event indicator dot */}
                <div className="h-1.5 mb-1 flex items-center justify-center">
                  {item.hasEvents && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-action'
                      }`}
                    />
                  )}
                </div>

                {/* Day Name */}
                <span
                  className={`text-[11px] font-semibold leading-none font-sans ${
                    isSelected ? 'text-blue-100 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.dayName}
                </span>

                {/* Day Number */}
                <span className="text-sm sm:text-base font-black leading-none mt-1 font-sans tabular-nums">
                  {item.dayNum}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Next week button */}
        <motion.button
          whileHover={isNextDisabled ? undefined : { scale: 1.05 }}
          whileTap={isNextDisabled ? undefined : { scale: 0.95 }}
          type="button"
          onClick={handleNextWeek}
          disabled={isNextDisabled}
          className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-[#EAF2FC] hover:text-[#0B3264] dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
          title="Minggu Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}
