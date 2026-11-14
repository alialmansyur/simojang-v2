import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, ShieldAlert } from 'lucide-react'
import { saveWasdalData } from '../../../../services/api/wasdalServicesApi'
import { SearchableInstansiSelect } from '../../SearchableInstansiSelect'

export function WasdalNetralitasFormModal({
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
    permasalahan: '',
    total: '',
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
        instansi: initialData.instansi_id || initialData.kodeins || '',
        permasalahan: initialData.permasalahan || '',
        total: initialData.total ?? '',
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
        permasalahan: '',
        total: '1',
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
    setFormData((prev) => ({ ...prev, [name]: value }))
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
    if (!formData.permasalahan.trim()) {
      setErrorMsg('Deskripsi permasalahan / kasus wajib diisi.')
      return
    }
    if (!formData.total || Number(formData.total) <= 0) {
      setErrorMsg('Total kasus harus lebih besar dari 0.')
      return
    }

    try {
      setIsSubmitting(true)
      await saveWasdalData(formData)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data pengawasan netralitas.')
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
      aria-labelledby="wasdal-netralitas-form-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto clean-scrollbar modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="wasdal-netralitas-form-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Data Pengawasan Netralitas' : 'Tambah Data Pengawasan Netralitas'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan pelanggaran netralitas, disiplin, dan kode etik ASN
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
              Instansi Terkait <span className="text-rose-500">*</span>
            </label>
            <SearchableInstansiSelect
              name="instansi"
              value={formData.instansi}
              onChange={(val) => setFormData((prev) => ({ ...prev, instansi: val }))}
              initialLabel={initialData?.instansi_name}
              placeholder="Cari atau pilih nama instansi daerah (Jabar / Banten)..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Permasalahan / Kategori Kasus <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="permasalahan"
              value={formData.permasalahan}
              onChange={handleChange}
              required
              placeholder="Contoh: Dugaan Pelanggaran Netralitas Pemilu / Pilkada"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Pegawai Terlapor / Kasus <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="total"
              value={formData.total}
              onChange={handleChange}
              min="1"
              required
              placeholder="1"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 font-bold"
            />
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
