import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { getEventDynamicStatus } from '../../../services/api/eventsApi'

export default function SelectedDateAgendaPanel({
  events,
  onOpenDetail,
  borderless = false,
}) {
  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) return []
    return [...events].sort((a, b) => {
      const timeA = a.start ? new Date(a.start).getTime() : 0
      const timeB = b.start ? new Date(b.start).getTime() : 0
      if (timeB !== timeA) return timeB - timeA
      return (b.id || 0) - (a.id || 0)
    })
  }, [events])

  if (!sortedEvents || sortedEvents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 text-center text-slate-400 text-xs font-medium font-sans bg-white dark:bg-slate-900 rounded-2xl ${
          borderless ? 'shadow-2xs' : 'border border-slate-200 dark:border-slate-800'
        }`}
      >
        Tidak ada agenda pada tanggal ini.
      </motion.div>
    )
  }

  return (
    <div className="space-y-3 font-sans">
      <AnimatePresence mode="popLayout">
        {sortedEvents.map((event, idx) => {
          const dynamicStatus = getEventDynamicStatus(event)

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => onOpenDetail(event)}
              className={`group p-4 rounded-2xl bg-white dark:bg-slate-900 transition-all cursor-pointer space-y-2 font-sans ${
                borderless
                  ? 'shadow-xs hover:shadow-sm'
                  : 'border border-slate-200 dark:border-slate-800 hover:border-[#175CD3]/60 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Top Row: Category and Dynamic Status Badge */}
              <div className="flex items-center justify-between gap-2 font-sans">
                <span className="text-xs font-semibold text-[#175CD3] dark:text-[#93C5FD] font-sans">
                  {event.category || 'Fasilitasi CAT'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border font-sans ${dynamicStatus.badgeClass}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${dynamicStatus.dotClass} ${
                      dynamicStatus.key === 'ongoing' ? 'animate-pulse' : ''
                    }`}
                  />
                  {dynamicStatus.label}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-[#0B3264] dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-[#93C5FD] transition-colors leading-snug line-clamp-2 font-sans">
                {event.title}
              </h4>

              {/* Bottom Row: Location (Left) and Time (Right) */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 font-sans">
                <div className="flex items-center gap-1 truncate max-w-[200px] font-sans">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-sans">{event.location}</span>
                </div>

                <div className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 font-sans tabular-nums">
                  {event.time || (event.start_time_raw ? `${event.start_time_raw.slice(0, 5)} WIB` : '08:00 - 16:00 WIB')}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
