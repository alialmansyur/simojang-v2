import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Target, AlertTriangle } from 'lucide-react'
import { storeIkkSasaran } from '../../../../services/api/tuServicesApi'

export function IkkSasaranModal({ isOpen, onClose, onSuccess, initialData }) {
  const [noUrut, setNoUrut] = useState('')
  const [namaSasaran, setNamaSasaran] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setNoUrut(String(initialData.no_urut ?? ''))
      setNamaSasaran(initialData.nama_sasaran || '')
    } else {
      setNoUrut('')
      setNamaSasaran('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!namaSasaran.trim() || namaSasaran.trim().length < 3) {
      setErrorMsg('Rumusan Sasaran Strategis wajib diisi (minimal 3 karakter).')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const payload = {
        no_urut: noUrut ? Number(noUrut) : null,
        nama_sasaran: namaSasaran.trim(),
      }

      if (initialData?.key || initialData?.id) {
        payload.key = initialData.key || initialData.id
      }

      const res = await storeIkkSasaran(payload)
      if (res && res.status === 'error') {
        throw new Error(res.message || 'Gagal menyimpan sasaran strategis.')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan sasaran strategis.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Sasaran Strategis' : 'Tambah Sasaran Strategis'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pohon Kinerja Renstra Level 1 • Kanreg III BKN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto clean-scrollbar space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nomor Urut Sasaran
            </label>
            <input
              type="number"
              min="1"
              value={noUrut}
              onChange={(e) => setNoUrut(e.target.value)}
              placeholder="Contoh: 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Rumusan Sasaran Strategis <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={namaSasaran}
              onChange={(e) => setNamaSasaran(e.target.value)}
              placeholder="Contoh: Terwujudnya Pembinaan Manajemen ASN yang Efektif dan Akuntabel"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Sasaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default IkkSasaranModal
