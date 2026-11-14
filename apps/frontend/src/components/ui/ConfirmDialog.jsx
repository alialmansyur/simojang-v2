import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from './Modal'

const TONE_STYLES = {
  danger: {
    iconWrap: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    button:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/30',
  },
  warning: {
    iconWrap: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    button:
      'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/30',
  },
  primary: {
    iconWrap: 'bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400',
    button:
      'bg-[#175CD3] hover:bg-[#154EB2] text-white focus:ring-blue-500/30',
  },
}

/**
 * Dialog konfirmasi terstandarisasi pengganti window.confirm() / confirm() native.
 */
export function ConfirmDialog({
  open,
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const visible = Boolean(open ?? isOpen)
  const palette = TONE_STYLES[tone] || TONE_STYLES.danger

  return (
    <Modal
      open={visible}
      onClose={isLoading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-60 ${palette.button}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconWrap}`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
          {message}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
