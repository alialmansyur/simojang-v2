import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Calendar,
  RefreshCw,
  ArrowRight,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react'
import {
  filterEventsByDate,
  filterEventsUpToDate,
} from '../../../services/api/eventsApi'
import SelectedDateAgendaPanel from '../../office/components/SelectedDateAgendaPanel'

function getTimeGreetingMeta(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 4 && hour < 11) {
    return {
      label: 'Selamat Pagi',
      icon: Sunrise,
      iconClass: 'text-amber-500 dark:text-amber-400',
    }
  }
  if (hour >= 11 && hour < 15) {
    return {
      label: 'Selamat Siang',
      icon: Sun,
      iconClass: 'text-amber-500 dark:text-amber-400',
    }
  }
  if (hour >= 15 && hour < 18) {
    return {
      label: 'Selamat Sore',
      icon: Sunset,
      iconClass: 'text-orange-500 dark:text-orange-400',
    }
  }
  return {
    label: 'Selamat Malam',
    icon: Moon,
    iconClass: 'text-[#175CD3] dark:text-[#93C5FD]',
  }
}

function formatTodayIndonesian(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function DashboardHeroBento({
  user,
  events = [],
  eventsLoading = false,
  onReload,
  isReloading = false,
  onOpenEventDetail,
}) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const greetingMeta = useMemo(() => getTimeGreetingMeta(now), [now])
  const todayLabel = useMemo(() => formatTodayIndonesian(now), [now])
  const todayStr = useMemo(() => now.toLocaleDateString('en-CA'), [now])

  const GreetingIcon = greetingMeta.icon
  const displayName = user?.name || user?.username || 'Rekan Kerja BKN'

  const todayEvents = useMemo(() => {
    const visible = filterEventsUpToDate(events, todayStr)
    return filterEventsByDate(visible, todayStr)
  }, [events, todayStr])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 8 Columns: Highlight Sapaan Clean (Tanpa Background Color & Tanpa Pill Metadata) */}
      <div className="lg:col-span-8 py-1 flex flex-col justify-between gap-5">
        <div className="space-y-2.5 max-w-2xl">
          <h1 className="tracking-tight leading-tight">
            <span className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-[#175CD3] dark:text-[#93C5FD]">
              <GreetingIcon className={`w-4 h-4 shrink-0 ${greetingMeta.iconClass}`} />
              <span>{greetingMeta.label},</span>
            </span>
            <br />
            <span className="inline-block mt-1 text-2xl sm:text-[30px] font-extrabold text-[#0B3264] dark:text-white">
              {displayName}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Selamat datang di workspace SIMOJANG Kanreg III BKN Bandung. Kelola layanan kepegawaian, pantau agenda kegiatan kantor, dan cek unggahan berkas terbaru dalam satu tampilan ringkas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/my-tasks')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Buka Layanan Saya</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/calendar-event')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#175CD3] dark:text-[#93C5FD]" />
            <span>Kalender Kegiatan</span>
          </button>

          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Muat ulang workspace dashboard"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Right 4 Columns: Agenda Hari Ini (Style Identik Halaman Kalender) */}
      <div className="lg:col-span-4 space-y-3.5 font-sans">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base font-bold text-[#0B3264] dark:text-white font-sans">
              Agenda Hari Ini
            </h2>
            <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">
              {todayLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/calendar-event')}
            className="px-3.5 py-1.5 rounded-2xl bg-white hover:bg-[#EAF2FC] text-[#0B3264] dark:bg-slate-900 dark:hover:bg-[#0B3264]/40 dark:text-[#93C5FD] text-xs font-bold font-sans shadow-xs inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <span>Kalender</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {eventsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs"
              />
            ))}
          </div>
        ) : (
          <SelectedDateAgendaPanel
            events={todayEvents}
            onOpenDetail={(ev) => onOpenEventDetail?.(ev)}
            borderless
          />
        )}
      </div>
    </div>
  )
}
