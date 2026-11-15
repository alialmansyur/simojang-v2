import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, X } from 'lucide-react'
import { fetchDashboardEvents } from '../../services/api/eventsApi'

export function EventRunningTicker() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true

    fetchDashboardEvents()
      .then((data) => {
        if (!active) return
        setEvents(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Ticker event error:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Filter kegiatan dalam rentang 1 hari hingga 1 minggu (Hari ini s/d H+7)
  const upcomingWeekEvents = useMemo(() => {
    if (!events.length) return []

    const now = new Date()
    // Awal hari ini (00:00:00)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime()
    // 7 hari ke depan (pukul 23:59:59)
    const sevenDaysLater = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59).getTime()

    const filtered = events.filter((ev) => {
      let startTime = 0
      if (ev.start) {
        startTime = new Date(ev.start).getTime()
      } else if (ev.start_date_raw) {
        startTime = new Date(`${ev.start_date_raw}T${ev.start_time_raw || '08:00:00'}`).getTime()
      }

      let endTime = 0
      if (ev.end) {
        endTime = new Date(ev.end).getTime()
      } else if (ev.end_date_raw) {
        endTime = new Date(`${ev.end_date_raw}T${ev.end_time_raw || '16:00:00'}`).getTime()
      } else if (startTime > 0) {
        endTime = startTime + 8 * 3600 * 1000
      }

      if (startTime === 0 && endTime === 0) return false

      const effectiveEnd = endTime > 0 ? endTime : startTime
      const effectiveStart = startTime > 0 ? startTime : endTime

      return effectiveEnd >= todayStart && effectiveStart <= sevenDaysLater
    })

    filtered.sort((a, b) => {
      const timeA = new Date(a.start || a.start_date_raw || 0).getTime()
      const timeB = new Date(b.start || b.start_date_raw || 0).getTime()
      return timeA - timeB
    })

    if (filtered.length === 0 && events.length > 0) {
      return events.slice(0, 4)
    }

    return filtered
  }, [events])

  if (dismissed) {
    return null
  }

  // Format tanggal natural (contoh: "Hari Ini", "Besok", "Senin, 16 Nov")
  const formatEventDate = (ev) => {
    try {
      const now = new Date()
      const todayStr = now.toLocaleDateString('en-CA')

      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA')

      const startDateStr = ev.start_date_raw || (ev.start ? ev.start.slice(0, 10) : '')
      const endDateStr = ev.end_date_raw || (ev.end ? ev.end.slice(0, 10) : startDateStr)

      if (startDateStr && endDateStr && todayStr >= startDateStr && todayStr <= endDateStr) {
        return 'Hari Ini'
      }

      if (startDateStr === tomorrowStr) {
        return 'Besok'
      }

      if (startDateStr) {
        const d = new Date(startDateStr)
        return d.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      }

      return ev.date || ''
    } catch {
      return ev.date || ''
    }
  }

  return (
    <div
      role="region"
      aria-label="Pengumuman Jadwal Agenda Kantor"
      className="ticker-container relative w-full bg-[#FACC15] dark:bg-amber-400 text-slate-950 border-b border-amber-400/60 dark:border-amber-500/60 shadow-2xs flex items-center overflow-hidden z-20 select-none h-9 transition-all m-0 shrink-0"
    >
      {/* Ticker Content Track: Berjalan mulus secara alami tanpa blok tombol kiri */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        {loading ? (
          <div className="px-5 text-xs font-medium text-slate-900/80">
            Memuat agenda kantor...
          </div>
        ) : upcomingWeekEvents.length === 0 ? (
          <div className="px-5 text-xs font-medium text-slate-900">
            Tidak ada agenda kantor dalam rentang 1 minggu ke depan.
          </div>
        ) : (
          <div className="ticker-track flex items-center">
            {/* Duplikasi 2x agar running text menyambung secara kontinu tanpa jeda */}
            {[0, 1].map((copyIdx) => (
              <div key={copyIdx} className="flex items-center gap-10 pr-10">
                {upcomingWeekEvents.map((ev, idx) => {
                  const dateLabel = formatEventDate(ev)

                  return (
                    <div
                      key={`${copyIdx}-${ev.id || idx}`}
                      onClick={() => navigate('/calendar-event')}
                      title={`Klik untuk membuka kalender: ${ev.title}`}
                      className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-900 font-medium"
                    >
                      {/* Badge Warning Soft membungkus Icon Calendar dan Tanggal (Tanpa Garis Bawah) */}
                      {dateLabel && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-900/10 border border-amber-900/15 text-[11px] font-bold text-slate-950 shrink-0 shadow-2xs">
                          <Calendar className="w-3 h-3 text-slate-900 shrink-0 opacity-90" />
                          <span>{dateLabel}</span>
                        </span>
                      )}

                      <span className="font-semibold text-slate-950">
                        {ev.title}
                      </span>

                      {ev.location && ev.location !== '-' && (
                        <span className="text-slate-800/85 font-normal">
                          ({ev.location})
                        </span>
                      )}

                      <span className="text-slate-700/50 font-bold mx-2 select-none">•</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tombol Tutup Minimalis di Pojok Kanan */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        title="Tutup pengumuman"
        aria-label="Tutup running text"
        className="px-2.5 h-full flex items-center justify-center text-slate-800/70 hover:text-slate-950 hover:bg-amber-400/50 transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
