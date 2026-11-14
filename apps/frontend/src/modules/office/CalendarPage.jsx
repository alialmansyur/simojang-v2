import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import {
  fetchDashboardEvents,
  selectFeaturedEvent,
  filterEventsByDate,
  filterEventsUpToDate,
} from '../../services/api/eventsApi'
import FeaturedEventCard from './components/FeaturedEventCard'
import CalendarWidget from './components/CalendarWidget'
import SelectedDateAgendaPanel from './components/SelectedDateAgendaPanel'
import EventListSection from './components/EventListSection'
import EventDetailModal from './components/EventDetailModal'

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), [])

  // Selection states (Default to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [activeModalEvent, setActiveModalEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load events directly from API
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchDashboardEvents()
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err.message || 'Gagal memuat jadwal agenda SIMOJANG.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchDashboardEvents()
      .then((data) => {
        if (cancelled) return
        setEvents(data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load events:', err)
        setError(err.message || 'Gagal memuat jadwal agenda SIMOJANG.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Hide events after today's date from highlight, calendar dots, and event lists
  const visibleEvents = useMemo(() => {
    return filterEventsUpToDate(events, todayStr)
  }, [events, todayStr])

  // Featured Event computation (strictly from events on or before today)
  const featuredEvent = useMemo(() => {
    return selectFeaturedEvent(visibleEvents, null, new Date())
  }, [visibleEvents])

  // Events filtered by selectedDate for the right-side list
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return visibleEvents.slice(0, 5)
    return filterEventsByDate(visibleEvents, selectedDate)
  }, [visibleEvents, selectedDate])

  // Handlers
  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr)
  }

  const handleOpenDetail = (event) => {
    setActiveModalEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setActiveModalEvent(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 font-sans"
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
            <div className="h-96 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-44 rounded-3xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={loadEvents}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Two-Column Layout (Matching Reference Screenshot) */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Featured Hero Card (Top) + Horizontal Event List (Bottom) */}
          <div className="contents lg:block lg:col-span-7 space-y-6">
            {/* 1. Featured Event Hero Card */}
            <div className="order-1">
              <FeaturedEventCard
                event={featuredEvent}
                onOpenDetail={handleOpenDetail}
              />
            </div>

            {/* 2. Main Horizontal Event List */}
            <div className="order-4">
              <EventListSection
                events={visibleEvents}
                onOpenDetail={handleOpenDetail}
              />
            </div>
          </div>

          {/* Kolom Kanan: Kalender Kegiatan (Top) + Agenda Tanggal Terpilih (Bottom) */}
          <div className="contents lg:block lg:col-span-5 space-y-4">
            {/* 3. Kalender Kegiatan (Date Strip + Full View) */}
            <div className="order-2">
              <CalendarWidget
                events={visibleEvents}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                maxDate={todayStr}
              />
            </div>

            {/* 4. Agenda Tanggal Terpilih Cards */}
            <div className="order-3">
              <SelectedDateAgendaPanel
                events={selectedDateEvents}
                onOpenDetail={handleOpenDetail}
                borderless
              />
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal (100% Matching Reference Screenshot) */}
      <EventDetailModal
        event={activeModalEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </motion.div>
  )
}
