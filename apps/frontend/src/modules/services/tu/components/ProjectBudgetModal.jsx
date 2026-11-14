import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, DollarSign, AlertCircle } from 'lucide-react'
import { storeProjectBudget } from '../../../../services/api/tuServicesApi'

export function ProjectBudgetModal({ isOpen, onClose, onSuccess, projectUid, initialData }) {
  const [realizationDate, setRealizationDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setRealizationDate(initialData.realization_date || new Date().toISOString().slice(0, 10))
      setAmount(initialData.amount || '')
      setDescription(initialData.description || '')
    } else {
      setRealizationDate(new Date().toISOString().slice(0, 10))
      setAmount('')
      setDescription('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Nominal pencairan anggaran harus lebih besar dari 0.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const fd = new FormData()
      fd.append('project_uid', projectUid)
      if (initialData?.id) fd.append('id', initialData.id)
      fd.append('realization_date', realizationDate)
      fd.append('amount', String(amount).replace(/[^0-9]/g, ''))
      fd.append('description', description.trim())

      const res = await storeProjectBudget(fd)
      if (res?.status === 'success' || res?.status === true) {
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error(res?.message || 'Gagal menyimpan pencairan anggaran.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan realisasi anggaran.')
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header (Matching /layanan/cltn) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-[#F8FAFC] dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Pencairan Anggaran' : 'Catat Pencairan Anggaran Proyek'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan termin SPK / SP2D realisasi belanja proyek
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Realisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={realizationDate}
                onChange={(e) => setRealizationDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nominal Realisasi (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Misal: 75000000"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Uraian Pencairan / Nomor SPK & SP2D
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Pembayaran Uang Muka Termin 1 (30%) - SP2D No. 260190100012440"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Action Buttons (Matching /layanan/cltn) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Pencairan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ProjectBudgetModal
