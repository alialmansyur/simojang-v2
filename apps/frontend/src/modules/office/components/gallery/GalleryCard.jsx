import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Eye, ImageOff, Pencil, Trash2, ZoomIn } from 'lucide-react'

export default function GalleryCard({
  item,
  index = 0,
  onOpenDetail,
  onEdit,
  onDelete,
}) {
  const [failedUrl, setFailedUrl] = useState('')
  const imgError = !item.img || failedUrl === item.img

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
      whileHover={{ y: -2 }}
      onClick={() => onOpenDetail(item)}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer shadow-xs hover:shadow-sm font-sans"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#E8F0FC] via-[#EFF4FC] to-[#DCE8FA] dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800/70 overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#123B73]/70 dark:text-slate-400 p-4">
            <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-slate-900/80 shadow-2xs flex items-center justify-center text-[#175CD3]/75 dark:text-[#93C5FD]/80">
              <ImageOff className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold">Foto tidak tersedia</span>
          </div>
        ) : (
          <img
            src={item.img}
            alt={item.title}
            loading="lazy"
            onError={() => setFailedUrl(item.img)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        <div className="absolute inset-0 bg-[#0B3264]/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#0B3264] text-xs font-bold shadow-xs">
            <ZoomIn className="w-3.5 h-3.5" />
            Lihat Foto
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div
                className="text-xs font-semibold text-[#175CD3] dark:text-[#93C5FD] truncate"
                title={item.teamName}
              >
                {item.teamName}
              </div>

              {item.layananName && (
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF2FC] text-[#0B3264] dark:bg-[#0B3264]/30 dark:text-[#93C5FD] max-w-full truncate"
                  title={item.layananName}
                >
                  {item.layananName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#175CD3] hover:bg-[#EAF2FC] dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                title="Ubah Dokumentasi"
                aria-label={`Ubah ${item.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Hapus Dokumentasi"
                aria-label={`Hapus ${item.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#0B3264] dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-[#93C5FD] transition-colors leading-snug line-clamp-2">
            {item.title}
          </h3>

          {item.desc && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {item.desc}
            </p>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{item.dateFormatted}</span>
          </span>

          <span className="inline-flex items-center gap-1 font-semibold text-[#175CD3] dark:text-[#93C5FD]">
            <Eye className="w-3.5 h-3.5" />
            <span>Detail</span>
          </span>
        </div>
      </div>
    </motion.article>
  )
}
