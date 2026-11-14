import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Calendar,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatIndonesianDate, getEventDynamicStatus } from '../../../services/api/eventsApi'

const ITEMS_PER_PAGE = 6

export default function EventListSection({
  events,
  onOpenDetail,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = useMemo(() => {
    const list = Array.from(new Set(events.map((e) => e.category).filter(Boolean)))
    return ['all', ...list]
  }, [events])

  const filteredEvents = useMemo(() => {
    const list = events.filter((e) => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = e.title?.toLowerCase().includes(q)
        const matchLoc = e.location?.toLowerCase().includes(q)
        const matchInstansi = e.instansi?.toLowerCase().includes(q)
        if (!matchTitle && !matchLoc && !matchInstansi) return false
      }

      return true
    })

    return [...list].sort((a, b) => {
      const timeA = a.start ? new Date(a.start).getTime() : 0
      const timeB = b.start ? new Date(b.start).getTime() : 0
      if (timeB !== timeA) return timeB - timeA
      return (b.id || 0) - (a.id || 0)
    })
  }, [events, selectedCategory, searchQuery])

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEvents, currentPage])

  return (
    <div className="space-y-4 font-sans">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-sans">
          {categories.map((cat) => (
            <motion.button
              whileTap={{ scale: 0.96 }}
              key={cat}
              onClick={() => {
                setSelectedCategory(cat)
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#0B3264] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-xs hover:bg-[#EAF2FC] hover:text-[#0B3264]'
              }`}
            >
              {cat === 'all' ? 'Semua Agenda' : cat}
            </motion.button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64 font-sans">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari agenda..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs font-sans rounded-xl bg-white dark:bg-slate-900 border border-transparent focus:outline-none focus:border-[#175CD3] text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Cards Matching Reference Screenshot (DESC Order) with Animation */}
      {paginatedEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900 shadow-xs text-xs font-medium font-sans"
        >
          Tidak ada agenda yang cocok dengan pencarian.
        </motion.div>
      ) : (
        <div className="space-y-3 font-sans">
          <AnimatePresence mode="popLayout">
            {paginatedEvents.map((event, index) => {
              const startDate = event.start ? new Date(event.start) : null
              const dayNumber = startDate ? startDate.getDate() : '-'
              const monthAbbr = startDate
                ? startDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
                : 'NOV'
              const dynamicStatus = getEventDynamicStatus(event)

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  whileHover={{ y: -2 }}
                  onClick={() => onOpenDetail(event)}
                  className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-sm font-sans"
                >
                  {/* Left side: Date Badge & Content */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Date Badge Box */}
                    <div className="w-12 h-13 sm:w-13 sm:h-14 rounded-xl bg-action text-white flex flex-col items-center justify-center shrink-0 shadow-2xs font-sans">
                      <span className="text-[10px] font-bold tracking-wider text-blue-100 leading-none font-sans">
                        {monthAbbr}
                      </span>
                      <span className="text-lg font-black leading-none mt-1 text-white font-sans tabular-nums">
                        {dayNumber}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1 min-w-0 font-sans">
                      <div className="text-xs font-semibold text-[#175CD3] dark:text-[#93C5FD] font-sans">
                        {event.category || 'Fasilitasi CAT'}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-[#0B3264] dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-[#93C5FD] transition-colors leading-snug line-clamp-1 sm:line-clamp-2 font-sans">
                        {event.title}
                      </h4>

                      {/* Metadata Row: 08:00 - 16:00 WIB • Date • Location */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 font-sans">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 font-sans">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {event.time || (event.start_time_raw ? `${event.start_time_raw.slice(0, 5)} WIB` : '08:00 - 16:00 WIB')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 font-medium font-sans">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {event.date || formatIndonesianDate(event.start)}
                        </span>
                        {event.location && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[220px] font-sans">
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Dynamic Status Badge */}
                  <div className="flex items-center self-start sm:self-center shrink-0 font-sans">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-sans ${dynamicStatus.badgeClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${dynamicStatus.dotClass} ${
                          dynamicStatus.key === 'ongoing' ? 'animate-pulse' : ''
                        }`}
                      />
                      {dynamicStatus.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 font-sans">
          <span className="text-xs text-slate-400 font-medium font-sans">
            Halaman {currentPage} dari {totalPages} ({filteredEvents.length} total)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EAF2FC] hover:text-[#0B3264] cursor-pointer font-sans transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EAF2FC] hover:text-[#0B3264] cursor-pointer font-sans transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
