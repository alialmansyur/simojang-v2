import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { updateCatSession } from '../../../../../services/api/sidigiCatServicesApi'

export function CatSessionEditModal(props) {
  if (!props.isOpen || !props.session) return null
  const sessionKey = props.session.id || props.session.uid || 'edit'
  return <CatSessionEditModalContent key={sessionKey} {...props} />
}

function CatSessionEditModalContent({ onClose, session, onSuccess }) {
  const [formData, setFormData] = useState(() => ({
    hadir: session.hadir ?? 0,
    tidak_hadir: session.tidak_hadir ?? 0,
    reschedule: session.reschedule ?? 0,
    nilai_min: session.nilai_min !== '-' && session.nilai_min !== null ? session.nilai_min : '',
    nilai_max: session.nilai_max !== '-' && session.nilai_max !== null ? session.nilai_max : '',
    memenuhi: session.memenuhi ?? 0,
    tidak_memenuhi: session.tidak_memenuhi ?? 0,
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      await updateCatSession({
        id: session.id,
        key: session.id || session.uid,
        instansi: session.instansi_id,
        tanggal: session.period_date,
        sesi: session.sesi,
        hadir: Number(formData.hadir) || 0,
        tidak_hadir: Number(formData.tidak_hadir) || 0,
        reschedule: Number(formData.reschedule) || 0,
        nilai_min: formData.nilai_min !== '' ? formData.nilai_min : 0,
        nilai_max: formData.nilai_max !== '' ? formData.nilai_max : 0,
        memenuhi: Number(formData.memenuhi) || 0,
        tidak_memenuhi: Number(formData.tidak_memenuhi) || 0,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan pembaruan sesi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPeserta = (Number(formData.hadir) || 0) + (Number(formData.tidak_hadir) || 0)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isSubmitting, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Ubah Data Sesi CAT
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Sesi {session.sesi} • {session.instansi_nama}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Readonly Info Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Tanggal Pelaksanaan</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {session.period_date || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Sesi Ujian</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Sesi Ke-{session.sesi}
              </div>
            </div>
          </div>

          {/* Kehadiran Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jumlah Hadir <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="hadir"
                value={formData.hadir}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tidak Hadir <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="tidak_hadir"
                value={formData.tidak_hadir}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reschedule
              </label>
              <input
                type="number"
                min="0"
                name="reschedule"
                value={formData.reschedule}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            Total Alokasi Peserta: <span className="font-bold text-slate-800 dark:text-slate-200">{totalPeserta}</span> orang
          </div>

          {/* Nilai Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nilai Minimum
              </label>
              <input
                type="number"
                step="any"
                name="nilai_min"
                value={formData.nilai_min}
                onChange={handleChange}
                placeholder="Contoh: 280.5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nilai Maksimum
              </label>
              <input
                type="number"
                step="any"
                name="nilai_max"
                value={formData.nilai_max}
                onChange={handleChange}
                placeholder="Contoh: 465.0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
          </div>

          {/* Kelulusan Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                Memenuhi (MS)
              </label>
              <input
                type="number"
                min="0"
                name="memenuhi"
                value={formData.memenuhi}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                Tidak Memenuhi (TMS)
              </label>
              <input
                type="number"
                min="0"
                name="tidak_memenuhi"
                value={formData.tidak_memenuhi}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
