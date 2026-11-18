import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Award } from 'lucide-react'
import { storeMtData, fetchStepMtOptions } from '../../../../services/api/pmaServicesApi'
import { SearchableInstansiSelect } from './SearchableInstansiSelect'

export function MtFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  initialData = null,
}) {
  const activeItem = editingItem || initialData
  const isEdit = Boolean(activeItem?.id)

  const buildInitialForm = (item) => {
    if (item) {
      return {
        key: item.id || '',
        instansi: item.instansi_id || '',
        period: item.period || '',
        startdate: item.period_date ? item.period_date.split(' ')[0] : '',
        stepProgress: Number(item.rw_mt_id) || 1,
        description: item.catatan || item.description || '',
      }
    }
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const today = now.toISOString().split('T')[0]
    return {
      key: '',
      instansi: '',
      period: `${yyyy}-${mm}`,
      startdate: today,
      stepProgress: 1,
      description: '',
    }
  }

  const [formData, setFormData] = useState(() => buildInitialForm(activeItem))
  const [prevSyncKey, setPrevSyncKey] = useState(() => `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`)

  const [stepList, setStepList] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentSyncKey = `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`
  if (currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey)
    if (isOpen) {
      setFormData(buildInitialForm(activeItem))
      setErrorMsg('')
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    fetchStepMtOptions()
      .then((steps) => {
        if (active) setStepList(steps)
      })
      .catch((err) => {
        if (active) setErrorMsg((prev) => prev || err?.message || 'Gagal memuat tahapan Manajemen Talenta.')
      })

    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.instansi) {
      setErrorMsg('Pilih instansi pengusul terlebih dahulu.')
      return
    }
    if (!formData.period) {
      setErrorMsg('Periode wajib diisi.')
      return
    }
    if (!formData.startdate) {
      setErrorMsg('Tanggal mulai implementasi wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeMtData({
        key: formData.key,
        instansi: formData.instansi,
        period: formData.period,
        startdate: formData.startdate,
        stepProgress: formData.stepProgress,
        description: formData.description || '',
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data Manajemen Talenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Ubah Data Manajemen Talenta' : 'Tambah Data Manajemen Talenta'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col modal-dialog-animated">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Data Manajemen Talenta' : 'Tambah Data Manajemen Talenta'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan 13 — Tim Kerja Pembinaan Manajemen ASN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Instansi Select (Searchable via react-select) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Instansi Pemerintah Daerah <span className="text-rose-500">*</span>
            </label>
            <SearchableInstansiSelect
              name="instansi"
              value={formData.instansi}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  instansi: typeof val === 'object' && val?.target ? val.target.value : val,
                }))
              }
              initialLabel={activeItem?.instansi_name || activeItem?.instansi}
              placeholder="Cari nama instansi pemerintah daerah..."
              required
            />
          </div>

          {/* Periode & Tanggal Mulai (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Periode (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="period"
                value={formData.period}
                onChange={handleChange}
                placeholder="2026-01"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startdate"
                value={formData.startdate}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Tahapan Progress MT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tahapan Progres Manajemen Talenta <span className="text-rose-500">*</span>
            </label>
            <select
              name="stepProgress"
              value={formData.stepProgress}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              {stepList.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.id}. {step.text || step.step_name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Pilih tahapan capaian implementasi manajemen talenta instansi yang bersangkutan.
            </p>
          </div>

          {/* Catatan / Deskripsi Aktivitas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan / Rincian Progres Asistensi
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Catatan hasil pendampingan atau progres tahapan manajemen talenta..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all clean-scrollbar"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Perbarui Data' : 'Simpan Data'}</span>
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
