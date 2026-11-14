import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, BookOpen, Link2 } from 'lucide-react'
import { storeKompetensiKarierData } from '../../../../services/api/pmaServicesApi'

export function PengembanganKompetensiFormModal({
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
        period_year: Number(item.period_year) || new Date().getFullYear(),
        tanggal_kegiatan: item.tanggal_kegiatan ? String(item.tanggal_kegiatan).split(' ')[0] : '',
        judul_kegiatan: item.judul_kegiatan || '',
        materi: item.materi || '',
        total_partisipan: item.total_partisipan ?? '',
        metode: item.metode || 'Klasikal',
        lokasi: item.lokasi || '',
        penyelenggara: item.penyelenggara || 'Tim Kerja PMA Kanreg III BKN',
        eviden_link: item.eviden_link || '',
        catatan: item.catatan || '',
      }
    }
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    return {
      key: '',
      period_year: now.getFullYear(),
      tanggal_kegiatan: today,
      judul_kegiatan: '',
      materi: '',
      total_partisipan: '',
      metode: 'Klasikal',
      lokasi: '',
      penyelenggara: 'Tim Kerja PMA Kanreg III BKN',
      eviden_link: '',
      catatan: '',
    }
  }

  const [formData, setFormData] = useState(() => buildInitialForm(activeItem))
  const [prevSyncKey, setPrevSyncKey] = useState(() => `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`)

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

  if (!isOpen || typeof document === 'undefined') return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.judul_kegiatan || formData.judul_kegiatan.length < 5) {
      setErrorMsg('Judul kegiatan wajib diisi minimal 5 karakter.')
      return
    }
    if (!formData.materi || formData.materi.length < 5) {
      setErrorMsg('Materi kegiatan wajib diisi minimal 5 karakter.')
      return
    }
    if (!formData.tanggal_kegiatan) {
      setErrorMsg('Tanggal kegiatan wajib dipilih.')
      return
    }
    if (formData.total_partisipan === '' || isNaN(Number(formData.total_partisipan))) {
      setErrorMsg('Total partisipan wajib diisi angka yang valid.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeKompetensiKarierData({
        key: formData.key,
        period_year: formData.period_year,
        tanggal_kegiatan: formData.tanggal_kegiatan,
        judul_kegiatan: formData.judul_kegiatan,
        materi: formData.materi,
        total_partisipan: Number(formData.total_partisipan),
        metode: formData.metode,
        lokasi: formData.lokasi || null,
        penyelenggara: formData.penyelenggara || null,
        eviden_link: formData.eviden_link || null,
        catatan: formData.catatan || null,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan agenda pengembangan kompetensi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Ubah Agenda Pengembangan Kompetensi' : 'Tambah Agenda Pengembangan Kompetensi'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Agenda Pengembangan Kompetensi' : 'Tambah Agenda Pengembangan Kompetensi'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan 15 — Bimbingan Teknis, Workshop, & Sosialisasi
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Judul Kegiatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Judul Kegiatan / Workshop <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="judul_kegiatan"
              value={formData.judul_kegiatan}
              onChange={handleChange}
              placeholder="Contoh: Bimtek Standar Kompetensi Jabatan Administrator & Pengawas"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Materi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pokok Materi Bahasan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="materi"
              value={formData.materi}
              onChange={handleChange}
              placeholder="Contoh: Penyusunan Kamus Kompetensi Teknis dan Uji Kinerja"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Tanggal, Metode, Partisipan (3 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_kegiatan"
                value={formData.tanggal_kegiatan}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Metode <span className="text-rose-500">*</span>
              </label>
              <select
                name="metode"
                value={formData.metode}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="Klasikal">Klasikal (Tatap Muka)</option>
                <option value="Tatap Muka">Tatap Muka</option>
                <option value="Daring (Zoom)">Daring (Zoom / Online)</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
                <option value="TIDAK DITENTUKAN">Tidak Ditentukan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Partisipan <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="total_partisipan"
                value={formData.total_partisipan}
                onChange={handleChange}
                placeholder="100"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
              />
            </div>
          </div>

          {/* Lokasi & Penyelenggara */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lokasi Kegiatan
              </label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi}
                onChange={handleChange}
                placeholder="Contoh: Savoy Homann Bandung / Gedung CAT"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Penyelenggara
              </label>
              <input
                type="text"
                name="penyelenggara"
                value={formData.penyelenggara}
                onChange={handleChange}
                placeholder="Contoh: Kanreg III BKN / BKD Jabar"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Eviden Link (Google Drive / Cloud) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tautan Bukti Dukung (Google Drive / Cloud Eviden)
            </label>
            <div className="relative">
              <input
                type="url"
                name="eviden_link"
                value={formData.eviden_link}
                onChange={handleChange}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Pelaksanaan
            </label>
            <textarea
              name="catatan"
              rows={2}
              value={formData.catatan}
              onChange={handleChange}
              placeholder="Catatan hasil diskusi, daftar hadir, atau tindak lanjut..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
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
                  <span>{isEdit ? 'Perbarui Agenda' : 'Simpan Agenda'}</span>
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
