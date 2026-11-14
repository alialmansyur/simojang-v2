import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Award } from 'lucide-react'
import { saveNspkData } from '../../../../services/api/wasdalServicesApi'
import { SearchableInstansiSelect } from '../../SearchableInstansiSelect'

export function NspkFormModal({
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
    instansi: '',
    level: 'A',
    nilai: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      const hasNilai =
        initialData.nilai !== null &&
        initialData.nilai !== undefined &&
        String(initialData.nilai).trim() !== ''
      setFormData({
        key: initialData.id || '',
        period: initialData.period || '',
        syncdate1: initialData.period_start_date || initialData.period_date || '',
        syncdate2: initialData.period_end_date || initialData.period_date || '',
        instansi: initialData.instansi_id || initialData.kodeins || '',
        level: initialData.level || 'B',
        nilai: hasNilai ? Number(initialData.nilai).toFixed(2) : '',
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
        instansi: '',
        level: 'A',
        nilai: '',
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
      const next = { ...prev, [name]: value }
      if (name === 'nilai') {
        const cleaned = String(value).replace(',', '.').trim()
        if (cleaned !== '' && !isNaN(Number(cleaned))) {
          const num = Number(cleaned)
          if (num >= 85) next.level = 'A'
          else if (num >= 70) next.level = 'B'
          else if (num >= 55) next.level = 'C'
          else next.level = 'D'
        }
      }
      return next
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
    if (!formData.instansi) {
      setErrorMsg('Silakan pilih atau cari instansi terlebih dahulu.')
      return
    }
    if (!formData.level) {
      setErrorMsg('Level / Peringkat NSPK wajib dipilih.')
      return
    }
    if (formData.nilai !== '') {
      const num = Number(String(formData.nilai).replace(',', '.'))
      if (isNaN(num) || num < 0 || num > 100) {
        setErrorMsg('Nilai indeks NSPK harus berupa angka antara 0 hingga 100.')
        return
      }
    }

    try {
      setIsSubmitting(true)
      await saveNspkData(formData)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data Indeks NSPK.')
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
      aria-labelledby="wasdal-nspk-form-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto clean-scrollbar modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="wasdal-nspk-form-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {isEdit ? 'Ubah Data Indeks NSPK' : 'Tambah Data Indeks NSPK'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penilaian norma, standar, prosedur, dan kriteria ASN daerah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instansi Daerah <span className="text-rose-500">*</span>
            </label>
            <SearchableInstansiSelect
              name="instansi"
              value={formData.instansi}
              onChange={(val) => setFormData((prev) => ({ ...prev, instansi: val }))}
              initialLabel={initialData?.instansi_name}
              placeholder="Cari atau pilih nama instansi daerah..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nilai Indeks NSPK (Opsional, 0 – 100)
            </label>
            <input
              type="number"
              name="nilai"
              step="0.01"
              min="0"
              max="100"
              value={formData.nilai}
              onChange={handleChange}
              placeholder="Contoh: 85.40 (kosongkan jika hanya mencatat Level)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Level / Peringkat Indeks NSPK <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  val: 'A',
                  label: 'Sangat Baik',
                  color:
                    'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                },
                {
                  val: 'B',
                  label: 'Baik',
                  color:
                    'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
                },
                {
                  val: 'C',
                  label: 'Cukup',
                  color:
                    'border-amber-500 bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
                },
                {
                  val: 'D',
                  label: 'Kurang',
                  color:
                    'border-rose-500 bg-rose-50/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
                },
              ].map((lvl) => {
                const isSelected = formData.level === lvl.val
                return (
                  <button
                    key={lvl.val}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, level: lvl.val }))}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${lvl.color} ring-2 ring-blue-500/30 font-bold shadow-xs`
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base font-extrabold block">{lvl.val}</span>
                    <span className="text-[10px] block opacity-80">{lvl.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#175CD3] hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
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
