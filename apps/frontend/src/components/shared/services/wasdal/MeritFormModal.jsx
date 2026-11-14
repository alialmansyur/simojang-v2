import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Award } from 'lucide-react'
import { saveMeritData } from '../../../../services/api/wasdalServicesApi'

export function MeritFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = Boolean(initialData?.id)

  const [formData, setFormData] = useState({
    key: '',
    period: '',
    syncdate1: '',
    syncdate2: '',
    usul_masuk: '',
    ms: '',
    tms: '',
    total_realisasi: '',
    sla_sesuai: '',
    sla_tidak_sesuai: '',
    persentase_sla: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        key: initialData.id || '',
        period: initialData.period || '',
        syncdate1: initialData.period_start_date || initialData.period_date || '',
        syncdate2: initialData.period_end_date || initialData.period_date || '',
        usul_masuk: initialData.usul_masuk ?? '',
        ms: initialData.ms ?? '',
        tms: initialData.tms ?? '',
        total_realisasi: initialData.total_realisasi ?? '',
        sla_sesuai: initialData.sla_sesuai ?? '',
        sla_tidak_sesuai: initialData.sla_tidak_sesuai ?? '',
        persentase_sla:
          initialData.persentase_sla !== undefined &&
          initialData.persentase_sla !== null &&
          initialData.persentase_sla !== ''
            ? `${initialData.persentase_sla}%`
            : '0.00%',
      })
    } else {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const firstDay = `${yyyy}-${mm}-01`
      const lastDay = new Date(yyyy, now.getMonth() + 1, 0).toISOString().split('T')[0]

      setFormData({
        key: '',
        period: `${yyyy}-${mm}`,
        syncdate1: firstDay,
        syncdate2: lastDay,
        usul_masuk: '',
        ms: '',
        tms: '',
        total_realisasi: '',
        sla_sesuai: '',
        sla_tidak_sesuai: '',
        persentase_sla: '',
      })
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }

      // Auto calculate total_realisasi if ms or tms change
      if (name === 'ms' || name === 'tms') {
        const msVal = Number(name === 'ms' ? value : prev.ms) || 0
        const tmsVal = Number(name === 'tms' ? value : prev.tms) || 0
        updated.total_realisasi = msVal + tmsVal
      }

      // Auto calculate persentase_sla if sla_sesuai or total_realisasi change
      if (name === 'sla_sesuai' || name === 'ms' || name === 'tms' || name === 'total_realisasi') {
        const ses = Number(name === 'sla_sesuai' ? value : prev.sla_sesuai) || 0
        const tot = Number(updated.total_realisasi) || 0
        if (tot > 0) {
          const pct = Math.min(100, Math.max(0, (ses / tot) * 100)).toFixed(2)
          updated.persentase_sla = `${pct}%`
        } else {
          updated.persentase_sla = '0.00%'
        }
      }

      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.period) {
      setErrorMsg('Periode bulan wajib diisi.')
      return
    }
    if (!formData.syncdate1 || !formData.syncdate2) {
      setErrorMsg('Tanggal mulai dan selesai wajib diisi.')
      return
    }
    if (formData.syncdate2 < formData.syncdate1) {
      setErrorMsg('Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.')
      return
    }

    try {
      setIsSubmitting(true)
      await saveMeritData(formData)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data sistem merit.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wasdal-merit-form-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto clean-scrollbar modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 id="wasdal-merit-form-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Data Pengawasan Sistem Merit' : 'Tambah Data Pengawasan Sistem Merit'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan usulan kepegawaian dan kepatuhan SLA instansi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Period Bulan <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                name="period"
                value={formData.period}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="syncdate1"
                value={formData.syncdate1}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="syncdate2"
                value={formData.syncdate2}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
              />
            </div>
          </div>

          {/* Section: Usulan & Realisasi */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Volume & Realisasi Usulan
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Usul Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="usul_masuk"
                  value={formData.usul_masuk}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  MS (Memenuhi) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="ms"
                  value={formData.ms}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  TMS (Tidak Memenuhi) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="tms"
                  value={formData.tms}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Realisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="total_realisasi"
                  value={formData.total_realisasi}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section: Capaian SLA */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Kepatuhan Service Level Agreement (SLA)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Sesuai SLA (≤ 4 HK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="sla_sesuai"
                  value={formData.sla_sesuai}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Melebihi SLA (&gt; 4 HK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="sla_tidak_sesuai"
                  value={formData.sla_tidak_sesuai}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Persentase Kepatuhan SLA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="persentase_sla"
                  value={formData.persentase_sla}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 96.50%"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 font-bold text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#175CD3] hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Data'}</span>
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
