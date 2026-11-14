import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react'
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  formatIndonesianDate
} from '../../../services/api/eventsApi'

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const gCalUrl = getGoogleCalendarUrl(event)

  // Full date and time formatted string matching reference screenshot:
  // e.g. "Senin, 02 Nov 2026 – Selasa, 10 Nov 2026, 08:00 - 16:00 WIB"
  const formattedDateTime = (() => {
    const datePart = event.date || formatIndonesianDate(event.start)
    const timePart = event.time || (event.start_time_raw ? `${event.start_time_raw.slice(0, 5)} WIB` : '08:00 - 16:00 WIB')
    return `${datePart}, ${timePart}`
  })()

  const participants = Array.isArray(event.participants) ? event.participants : []

  return createPortal(
    <AnimatePresence>
      <div data-motion-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Dialog Surface (100% Matching Reference Screenshot) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-10 my-8 flex flex-col max-h-[92vh] font-sans"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-sans">
                Detail Agenda
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0B3264] dark:text-white leading-snug font-sans">
                {event.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1 -mr-1"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-7 space-y-4 overflow-y-auto font-sans text-sm">
            {/* Row 1: Deskripsi */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                Deskripsi
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm leading-relaxed sm:text-right max-w-lg">
                {event.description || 'Tidak ada deskripsi detail untuk agenda ini.'}
              </p>
            </div>

            {/* Row 2: Kategori */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                Kategori
              </span>
              <div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#EAF2FC] text-[#0B3264] dark:bg-[#0B3264]/30 dark:text-[#93C5FD]">
                  {event.category || 'Fasilitasi CAT'}
                </span>
              </div>
            </div>

            {/* Row 3: Waktu Pelaksanaan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                Waktu Pelaksanaan
              </span>
              <div className="flex items-center sm:justify-end gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-[#175CD3] shrink-0" />
                <span className="sm:text-right">{formattedDateTime}</span>
              </div>
            </div>

            {/* Row 4: Lokasi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                Lokasi
              </span>
              <div className="flex items-center sm:justify-end gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-[#175CD3] shrink-0" />
                <span className="sm:text-right">{event.location}</span>
              </div>
            </div>

            {/* Row 5: No Surat Tugas */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                No Surat Tugas
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm text-right">
                {event.stNumber || '-'}
              </span>
            </div>

            {/* Row 6: Tim Kerja */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 sm:w-40">
                Tim Kerja
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm sm:text-right">
                {event.team || 'Tim Kerja Sistem Informasi dan Digitalisasi'}
              </span>
            </div>

            {/* Row 7: Petugas */}
            <div className="space-y-2 pt-1">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">
                Petugas
              </div>

              {/* Table Matching Screenshot */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
                <div className="grid grid-cols-3 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
                  <div>Jabatan</div>
                  <div className="text-center">NIP</div>
                  <div className="text-right">Nama Petugas</div>
                </div>

                {participants.length === 0 ? (
                  <div className="py-5 text-center text-xs font-medium text-slate-400">
                    Tidak ada petugas
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {participants.map((p, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 px-4 py-3 font-medium text-slate-700 dark:text-slate-200 items-center"
                      >
                        <div className="truncate font-semibold">{p.position || '-'}</div>
                        <div className="text-center font-mono text-[11px] text-slate-400 truncate">
                          {p.nip || '-'}
                        </div>
                        <div className="text-right font-bold truncate text-[#0B3264] dark:text-[#93C5FD]">
                          {p.name || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action Buttons Matching Screenshot */}
          <div className="p-6 sm:p-7 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            {/* Button 1: Simpan Jadwal (.ics) */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => downloadIcsFile(event)}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-[#039855] hover:bg-[#027A48] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Simpan Jadwal (.ics)
            </motion.button>

            {/* Button 2: Google Calendar */}
            <motion.a
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              href={gCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              Google Calendar
            </motion.a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
