import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'

export default function GalleryDeleteDialog({
  isOpen = false,
  item = null,
  isDeleting = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !item) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-delete-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-5 sm:p-6 space-y-4 modal-dialog-animated">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="gallery-delete-title"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              Hapus Dokumentasi Kegiatan?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Anda yakin ingin menghapus dokumentasi{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                &ldquo;{item.title}&rdquo;
              </span>
              ? Foto dan data akan dihapus permanen.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Ya, Hapus</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
