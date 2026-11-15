import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Tag,
  MapPin,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { formatIndonesianDate, getEventDynamicStatus } from '../../../services/api/eventsApi'

export default function FeaturedEventCard({ event, onOpenDetail }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const dynamicStatus = getEventDynamicStatus(event)

  useEffect(() => {
    if (!event?.start) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const start = new Date(event.start).getTime()
      const end = event.end ? new Date(event.end).getTime() : start + 8 * 3600 * 1000

      if (now >= start && now <= end) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else if (now < start) {
        const diff = Math.max(0, start - now)
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)
        setCountdown({ days, hours, minutes, seconds })
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [event?.start, event?.end])

  if (!event) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3264] to-[#072449] text-white p-7 sm:p-8 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      {/* Background Watermark Logo using public/logo.png */}
      <div className="absolute -right-6 -bottom-8 w-64 h-64 sm:w-80 sm:h-80 pointer-events-none select-none opacity-20 transition-opacity">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Top Badges Row: Only Category, Status, and Location */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#175CD3] text-white shadow-xs">
              <Tag className="w-3.5 h-3.5" />
              {event.category || 'Fasilitasi CAT'}
            </span>

            {/* Dynamic Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                dynamicStatus.key === 'ongoing'
                  ? 'bg-[#ECFDF3] border-[#A6F4C5] text-[#067647]'
                  : dynamicStatus.key === 'upcoming'
                  ? 'bg-[#FFFAEB] border-[#FEDF89] text-[#B54708]'
                  : 'bg-white/10 border-white/20 text-white/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dynamicStatus.key === 'ongoing'
                    ? 'bg-[#067647] animate-pulse'
                    : dynamicStatus.key === 'upcoming'
                    ? 'bg-[#B54708]'
                    : 'bg-white/60'
                }`}
              />
              {dynamicStatus.label}
            </span>
          </div>

          {/* Location Badge on the right */}
          {event.location && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          onClick={() => onOpenDetail(event)}
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug hover:text-blue-200 transition-colors cursor-pointer"
        >
          {event.title}
        </h2>

        {/* Time & Date Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-blue-100/90 font-medium font-sans">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-300" />
            {event.time || (event.start_time_raw ? `${event.start_time_raw.slice(0, 5)} WIB` : '08:00 - 16:00 WIB')}
          </span>
          <span className="text-blue-300/60">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-300" />
            {event.date || formatIndonesianDate(event.start)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed max-w-3xl line-clamp-3 font-sans">
            {event.description}
          </p>
        )}

        {/* Bottom Row: Hitung Mundur & Button Detail */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-white/10">
          {/* Hitung Mundur in Plus Jakarta Sans */}
          <div className="space-y-1.5 font-sans">
            <div className="text-[10px] font-bold tracking-wider text-blue-200 uppercase font-sans">
              Hitung Mundur Pelaksanaan:
            </div>
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-black/25 border border-white/15 font-sans">
              <div className="w-10 py-1 rounded-lg bg-white/10 text-center">
                <div className="text-xs sm:text-sm font-black font-sans tabular-nums leading-none">
                  {String(countdown.days).padStart(2, '0')}
                </div>
                <div className="text-[8px] font-bold text-blue-200 leading-none mt-1 font-sans">
                  HARI
                </div>
              </div>
              <span className="text-white/60 font-bold text-xs">:</span>
              <div className="w-10 py-1 rounded-lg bg-white/10 text-center">
                <div className="text-xs sm:text-sm font-black font-sans tabular-nums leading-none">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <div className="text-[8px] font-bold text-blue-200 leading-none mt-1 font-sans">
                  JAM
                </div>
              </div>
              <span className="text-white/60 font-bold text-xs">:</span>
              <div className="w-10 py-1 rounded-lg bg-white/10 text-center">
                <div className="text-xs sm:text-sm font-black font-sans tabular-nums leading-none">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <div className="text-[8px] font-bold text-blue-200 leading-none mt-1 font-sans">
                  MNT
                </div>
              </div>
              <span className="text-white/60 font-bold text-xs">:</span>
              <div className="w-10 py-1 rounded-lg bg-white/10 text-center">
                <div className="text-xs sm:text-sm font-black font-sans tabular-nums leading-none text-sky-300">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
                <div className="text-[8px] font-bold text-blue-200 leading-none mt-1 font-sans">
                  DTK
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onOpenDetail(event)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#175CD3] hover:bg-[#1249A8] text-white transition-all cursor-pointer shadow-md self-start sm:self-auto font-sans"
          >
            Detail Agenda
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
