import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({
  open,
  isOpen,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'lg',
}) {
  const isModalOpen = Boolean(open ?? isOpen)

  useEffect(() => {
    if (!isModalOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen, onClose])

  const sizeClass = {
    sm: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size] || 'max-w-3xl'

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence mode="wait">
      {isModalOpen ? (
        <motion.div
          key="modal-portal"
          data-motion-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop with blur & pointer cursor */}
          <div
            aria-label="Tutup modal"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Dialog Card */}
          <motion.div
            key="modal-dialog-card"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizeClass} rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl shadow-slate-950/25 overflow-hidden z-10 my-auto`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4 bg-white/95 dark:bg-slate-800/95">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {description ? (
                  <p className="mt-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer active:scale-90 hover:rotate-90 duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[72vh] overflow-y-auto custom-scroll text-slate-700 dark:text-slate-200 font-medium">
              {children}
            </div>

            {/* Footer */}
            {footer ? (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/40 flex flex-wrap justify-end gap-3 items-center">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
