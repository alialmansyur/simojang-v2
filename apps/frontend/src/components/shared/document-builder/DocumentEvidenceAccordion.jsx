import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from 'lucide-react'
import { DEFAULT_DOKUMENTASI_CATEGORIES } from './documentBuilderUtils'

export function DocumentEvidenceAccordion({
  categories = DEFAULT_DOKUMENTASI_CATEGORIES,
  evidenceMap = {},
  onUpload,
  onDelete,
  disabled = false,
}) {
  const [activeCategoryKey, setActiveCategoryKey] = useState(null)
  const [dragOverKey, setDragOverKey] = useState(null)
  const fileInputRef = useRef(null)

  const handleRowClick = (key) => {
    setActiveCategoryKey((prev) => (prev === key ? null : key))
  }

  const handleFileChange = (categoryKey, e) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(categoryKey, file)
    }
    // Reset file input
    if (e.target) e.target.value = ''
  }

  const handleDrop = (categoryKey, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(null)
    if (disabled) return
    const file = e.dataTransfer?.files?.[0]
    if (file && onUpload) {
      onUpload(categoryKey, file)
    }
  }

  const handleDragOver = (categoryKey, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragOverKey(categoryKey)
    }
  }

  const handleDragLeave = (categoryKey, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(null)
  }

  const totalFilled = categories.filter((c) => Boolean(evidenceMap[c.key])).length

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#175CD3]" />
            <span>Dokumentasi & Eviden Kegiatan</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Klik baris kategori untuk membuka dropzone upload. Foto otomatis dikompres agar optimal saat cetak PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalFilled} dari {categories.length} Terisi</span>
          </span>
        </div>
      </div>

      {/* Row-Based Accordion List */}
      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const isExpanded = activeCategoryKey === cat.key
          const photoUrl = evidenceMap[cat.key]
          const isDragging = dragOverKey === cat.key

          return (
            <div
              key={cat.key}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'border-[#175CD3]/60 bg-blue-50/15 dark:bg-blue-950/20 shadow-xs'
                  : photoUrl
                  ? 'border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-slate-900'
                  : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Row Header Button */}
              <div
                onClick={() => handleRowClick(cat.key)}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer select-none transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRowClick(cat.key)
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Number Badge */}
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                      photoUrl
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isExpanded
                        ? 'bg-[#175CD3] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                {/* Right Status Indicators */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {photoUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={photoUrl}
                        alt={cat.label}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <Check className="w-3 h-3" />
                        <span>Terpasang</span>
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onDelete) onDelete(cat.key)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus foto eviden ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Belum Ada Foto
                    </span>
                  )}

                  {/* Chevron Icon */}
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-[#175CD3]' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Animated Expandable Dropzone Container */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="dropzone-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-850/30"
                  >
                    <div className="p-4 sm:p-5">
                      {photoUrl ? (
                        /* Previews with action controls */
                        <div className="space-y-3">
                          <div className="relative aspect-16/9 sm:aspect-21/9 max-h-72 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                            <img
                              src={photoUrl}
                              alt={cat.label}
                              className="w-full h-full object-cover"
                            />
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => onDelete && onDelete(cat.key)}
                                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold shadow-md backdrop-blur-xs transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Foto</span>
                              </button>
                            )}
                          </div>

                          {!disabled && (
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs">
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ganti Foto Kategori Ini</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(cat.key, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Single Interactive Dropzone Active */
                        <div
                          onDragOver={(e) => handleDragOver(cat.key, e)}
                          onDragLeave={(e) => handleDragLeave(cat.key, e)}
                          onDrop={(e) => handleDrop(cat.key, e)}
                          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-150 ${
                            isDragging
                              ? 'border-[#175CD3] bg-blue-50/60 dark:bg-blue-950/40 ring-4 ring-[#175CD3]/10'
                              : 'border-slate-300 dark:border-slate-700 hover:border-[#175CD3] dark:hover:border-blue-400 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={disabled}
                            onChange={(e) => handleFileChange(cat.key, e)}
                            className="hidden"
                            id={`file-input-${cat.key}`}
                          />

                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                            <UploadCloud className="w-6 h-6" />
                          </div>

                          <label
                            htmlFor={`file-input-${cat.key}`}
                            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-[#175CD3] transition-colors block"
                          >
                            Klik untuk unggah atau seret foto ke sini
                          </label>

                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            Format yang didukung: JPG, PNG, WEBP (Maksimal 10MB, auto-compressed)
                          </p>

                          <label
                            htmlFor={`file-input-${cat.key}`}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Pilih Berkas Foto</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
