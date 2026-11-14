import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

export default function GalleryDetailLightboxModal({
  items = [],
  activeIndex = -1,
  isOpen = false,
  onClose,
  onSelectIndex,
  onEdit,
  onDelete,
}) {
  const [failedImages, setFailedImages] = useState({})
  const activeThumbRef = useRef(null)

  const activeItem =
    isOpen && activeIndex >= 0 && activeIndex < items.length
      ? items[activeIndex]
      : null

  const canNavigate = items.length > 1

  useEffect(() => {
    if (isOpen && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [isOpen, activeIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && canNavigate) {
        onSelectIndex((activeIndex - 1 + items.length) % items.length)
      } else if (e.key === 'ArrowRight' && canNavigate) {
        onSelectIndex((activeIndex + 1) % items.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeIndex, items.length, canNavigate, onClose, onSelectIndex])

  if (!isOpen || !activeItem) return null

  const hasImageError = !activeItem.img || Boolean(failedImages[activeItem.img])

  const handlePrev = () => {
    if (!canNavigate) return
    onSelectIndex((activeIndex - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    if (!canNavigate) return
    onSelectIndex((activeIndex + 1) % items.length)
  }

  return createPortal(
    <AnimatePresence>
      <div
        data-motion-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-lightbox-title"
      >
        {/* Backdrop matching EventDetailModal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Surface matching EventDetailModal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-y-auto lg:overflow-hidden z-10 flex flex-col lg:flex-row max-h-[90dvh]"
        >
          {/* Left: Lightbox Photo Stage */}
          <div className="relative flex-1 min-w-0 overflow-hidden bg-slate-950 flex flex-col justify-between min-h-[260px] sm:min-h-[340px] lg:min-h-[500px]">
            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-xs border border-white/15 text-white text-xs font-semibold tabular-nums">
                {activeIndex + 1} / {items.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup lightbox"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative flex-1 min-w-0 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              {hasImageError ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-8 text-center">
                  <ImageOff className="w-12 h-12" />
                  <p className="text-sm font-medium">Foto dokumentasi tidak dapat dimuat</p>
                </div>
              ) : (
                <img
                  key={activeItem.img}
                  src={activeItem.img}
                  alt={activeItem.title}
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [activeItem.img]: true }))
                  }
                  className="max-w-full max-h-[36dvh] sm:max-h-[44dvh] lg:max-h-[62dvh] w-auto h-auto object-contain rounded-2xl select-none"
                />
              )}

              {canNavigate && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#175CD3] border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title="Foto Sebelumnya (Panah Kiri)"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#175CD3] border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title="Foto Berikutnya (Panah Kanan)"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {canNavigate && (
              <div className="w-full min-w-0 px-4 py-3 bg-black/45 border-t border-white/10 flex items-center gap-2 overflow-x-auto clean-scrollbar">
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      ref={isActive ? activeThumbRef : null}
                      type="button"
                      onClick={() => onSelectIndex(idx)}
                      aria-label={`Pilih foto ${item.title}`}
                      className={`relative w-14 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#175CD3] ring-2 ring-white/40 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {failedImages[item.img] || !item.img ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <ImageOff className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <img
                          src={item.img}
                          alt={item.title}
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [item.img]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Detail Panel matching EventDetailModal rows */}
          <div className="w-full lg:w-[370px] xl:w-[400px] shrink-0 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
                  Detail Dokumentasi
                </span>
                <h3
                  id="gallery-lightbox-title"
                  className="text-base sm:text-lg font-bold text-[#0B3264] dark:text-white leading-snug break-words"
                >
                  {activeItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="hidden lg:flex w-8 h-8 rounded-xl items-center justify-center shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup (ESC)"
                aria-label="Tutup detail dokumentasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Rows matching EventDetailModal */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-sm flex-1 min-h-0 clean-scrollbar">
              {/* Row 1: Deskripsi */}
              <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block">
                  Deskripsi
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">
                  {activeItem.desc || 'Tidak ada deskripsi detail untuk dokumentasi ini.'}
                </p>
              </div>

              {/* Row 2: Tim Kerja */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 pt-0.5">
                  Tim Kerja
                </span>
                <span className="max-w-[65%] px-3 py-1 rounded-xl text-xs font-bold bg-[#EAF2FC] text-[#0B3264] dark:bg-[#0B3264]/30 dark:text-[#93C5FD] text-right leading-snug break-words">
                  {activeItem.teamName}
                </span>
              </div>

              {/* Row 3: Layanan (jika ada) */}
              {activeItem.layananName && (
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                    Layanan
                  </span>
                  <span className="max-w-[65%] font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm text-right leading-snug break-words">
                    {activeItem.layananName}
                  </span>
                </div>
              )}

              {/* Row 4: Tanggal Kegiatan */}
              <div className="flex items-center justify-between gap-3 pb-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                  Tanggal
                </span>
                <div className="flex items-center justify-end gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm text-right">
                  <Calendar className="w-4 h-4 text-[#175CD3] shrink-0" />
                  <span>{activeItem.dateFormatted}</span>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons matching EventDetailModal */}
            <div className="p-5 sm:p-6 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => onEdit(activeItem)}
                className="flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#175CD3] hover:bg-[#1249A8] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Ubah
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => onDelete(activeItem)}
                className="shrink-0 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
