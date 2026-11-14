import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { getAuthSession, subscribeAuthChange } from '../../services/auth'
import { fetchDashboardSummary } from '../../services/api/dashboardApi'
import { fetchDashboardEvents } from '../../services/api/eventsApi'
import EventDetailModal from '../office/components/EventDetailModal'
import { SimojangDashboardSkeleton } from './components/SimojangDashboardSkeleton'
import { DashboardHeroBento } from './components/DashboardHeroBento'
import { DashboardRecentTable } from './components/DashboardRecentTable'

export default function SimojangDashboard() {
  const [session, setSession] = useState(() => getAuthSession())
  const [reloadTick, setReloadTick] = useState(0)
  const [summary, setSummary] = useState(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [activeModalEvent, setActiveModalEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    return subscribeAuthChange(() => {
      setSession(getAuthSession())
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchDashboardSummary({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        setSummary(data)
        setErrorMsg('')
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return
        setErrorMsg(err?.message || 'Gagal memuat workspace dashboard SIMOJANG.')
      })
      .finally(() => {
        if (controller.signal.aborted) return
        setIsInitialLoading(false)
        setIsReloading(false)
      })

    return () => {
      controller.abort()
    }
  }, [reloadTick])

  useEffect(() => {
    let cancelled = false

    fetchDashboardEvents()
      .then((data) => {
        if (cancelled) return
        setEvents(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setEvents([])
      })
      .finally(() => {
        if (!cancelled) {
          setEventsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [reloadTick])

  const handleReloadAll = () => {
    setIsReloading(true)
    setEventsLoading(true)
    setErrorMsg('')
    setReloadTick((t) => t + 1)
  }

  const handleOpenEventDetail = (event) => {
    setActiveModalEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseEventModal = () => {
    setIsModalOpen(false)
    setActiveModalEvent(null)
  }

  if (isInitialLoading && !summary) {
    return <SimojangDashboardSkeleton />
  }

  if (errorMsg && !summary) {
    return (
      <div className="rounded-2xl border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-[#B42318] dark:text-rose-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {errorMsg}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReloadAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {errorMsg && (
        <div className="px-4 py-3 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-[#FFFAEB] dark:bg-amber-950/30 text-[#B54708] dark:text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Sebagian data gagal diperbarui: {errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleReloadAll}
            className="font-bold underline shrink-0 cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Blok 1: Sapaan Personal (8) + Agenda Hari Ini (4 - Style Halaman Kalender) */}
      <DashboardHeroBento
        user={session?.user}
        events={events}
        eventsLoading={eventsLoading}
        onReload={handleReloadAll}
        isReloading={isReloading}
        onOpenEventDetail={handleOpenEventDetail}
      />

      {/* Blok 2: Aktivitas Unggahan Layanan Terbaru (Tabel Ringkas 4 Kolom) */}
      <DashboardRecentTable activities={summary?.recent_activities || []} />

      {/* Modal Detail Agenda (Shared dengan Halaman Kalender) */}
      <EventDetailModal
        event={activeModalEvent}
        isOpen={isModalOpen}
        onClose={handleCloseEventModal}
      />
    </motion.div>
  )
}
