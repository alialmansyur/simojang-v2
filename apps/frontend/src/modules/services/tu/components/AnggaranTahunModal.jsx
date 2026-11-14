import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Calendar, AlertCircle } from 'lucide-react'
import { storeTahunAnggaran } from '../../../../services/api/tuServicesApi'

export function AnggaranTahunModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}) {
  const [tahun, setTahun] = useState('')
  const [targetPersen, setTargetPersen] = useState('95.50')
  const [isActive, setIsActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setErrorMsg('')
    if (editData?.id) {
      setTahun(String(editData.tahun || ''))
      setTargetPersen(String(editData.target_persen || '95.50'))
      setIsActive(Number(editData.is_active || 0) === 1)
    } else {
      setTahun(String(new Date().getFullYear() + 1))
      setTargetPersen('95.50')
      setIsActive(false)
    }
  }, [isOpen, editData])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    const numTahun = Number(tahun)
    if (!numTahun || numTahun < 2000 || numTahun > 2100) {
      setErrorMsg('Tahun anggaran harus berupa 4 digit tahun yang valid (2000-2100).')
      return
    }

    const numTarget = parseFloat(targetPersen)
    if (isNaN(numTarget) || numTarget < 0 || numTarget > 100) {
      setErrorMsg('Target penyerapan harus bernilai antara 0% s.d. 100%.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        tahun: numTahun,
        target_persen: numTarget,
        is_active: isActive ? 1 : 0,
      }

      if (editData?.id) {
        payload.key = editData.id
      }

      const res = await storeTahunAnggaran(payload)
      if (res?.status === 'success') {
        if (onSuccess) onSuccess(res)
        onClose()
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan data tahun anggaran.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menyimpan tahun anggaran.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEdit = Boolean(editData?.id)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Tahun Anggaran' : 'Tambah Tahun Anggaran'}
              </h2>
              <p className="text-xs text-slate-400">
                Pengaturan target capaian penyerapan tahunan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="form-anggaran-tahun" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tahun */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Tahun Anggaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              required
              min="2000"
              max="2100"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
              placeholder="Contoh: 2026"
            />
          </div>

          {/* Target Persen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Target Penyerapan (%) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={targetPersen}
              onChange={(e) => setTargetPersen(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
              placeholder="Contoh: 95.50"
            />
            <p className="text-[10px] text-slate-400 mt-1">Target persentase penilaian IKPA capaian anggaran.</p>
          </div>

          {/* Set Active */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#175CD3] focus:ring-blue-500/30"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Set sebagai Tahun Anggaran Aktif
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Tahun ini akan menjadi default pilihan transaksi dan pemantauan DIPA.
                </span>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="form-anggaran-tahun"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Simpan Tahun</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
