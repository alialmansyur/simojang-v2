import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, TrendingUp } from 'lucide-react'
import {
  storeKinerjaData,
  fetchKinerjaOptions,
} from '../../../../services/api/pmaServicesApi'
import { SearchableInstansiSelect } from './SearchableInstansiSelect'

export function KinerjaFormModal({
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
        kategori_id: Number(item.kategori_id) || 1,
        period_year: Number(item.period_year) || new Date().getFullYear(),
        period_date: item.period_date ? String(item.period_date).split(' ')[0] : '',
        capaian_percent: item.capaian_percent ?? item.capaian_persen ?? '',
        pendampingan_date: item.pendampingan_date ? String(item.pendampingan_date).split(' ')[0] : '',
        catatan: item.catatan || '',
      }
    }
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    return {
      key: '',
      instansi: '',
      kategori_id: 1,
      period_year: now.getFullYear(),
      period_date: today,
      capaian_percent: '',
      pendampingan_date: '',
      catatan: '',
    }
  }

  const [formData, setFormData] = useState(() => buildInitialForm(activeItem))
  const [prevSyncKey, setPrevSyncKey] = useState(() => `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`)

  const [kategoriList, setKategoriList] = useState([
    { id: 1, code: 'PELAPORAN_SKP', nama: 'Pelaporan SKP' },
    { id: 2, code: 'PENYUSUNAN_SKP', nama: 'Penyusunan SKP' },
    { id: 3, code: 'PEMANFAATAN_EKINERJA', nama: 'Pemanfaatan E-Kinerja' },
  ])
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
    fetchKinerjaOptions()
      .then((opt) => {
        if (active && opt.kategori && opt.kategori.length > 0) {
          setKategoriList(opt.kategori)
        }
      })
      .catch((err) => {
        if (active) setErrorMsg((prev) => prev || err?.message || 'Gagal memuat opsi pembinaan kinerja.')
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
      setErrorMsg('Pilih instansi pemerintah daerah terlebih dahulu.')
      return
    }
    if (!formData.period_date) {
      setErrorMsg('Tanggal evaluasi wajib diisi.')
      return
    }
    if (formData.capaian_percent === '' || isNaN(Number(formData.capaian_percent))) {
      setErrorMsg('Capaian kinerja (%) wajib diisi angka yang valid.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeKinerjaData({
        key: formData.key,
        instansi: formData.instansi,
        kategori_id: formData.kategori_id,
        period_year: formData.period_year,
        period_date: formData.period_date,
        capaian_percent: Number(formData.capaian_percent),
        pendampingan_date: formData.pendampingan_date || null,
        catatan: formData.catatan || '',
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan evaluasi pembinaan kinerja.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Ubah Evaluasi Pembinaan Kinerja' : 'Tambah Evaluasi Pembinaan Kinerja'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Evaluasi Pembinaan Kinerja' : 'Tambah Evaluasi Pembinaan Kinerja'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan 14 — Pembinaan Kinerja dan Penghargaan
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto clean-scrollbar">
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

          {/* Kategori Layanan Kinerja */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kategori Kinerja <span className="text-rose-500">*</span>
            </label>
            <select
              name="kategori_id"
              value={formData.kategori_id}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              {kategoriList.map((kat) => (
                <option key={kat.id} value={kat.id}>
                  {kat.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun & Tanggal Evaluasi (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tahun Periode <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="period_year"
                value={formData.period_year}
                onChange={handleChange}
                min={2020}
                max={2030}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Evaluasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="period_date"
                value={formData.period_date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Capaian Persen & Tanggal Pendampingan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Capaian Kinerja (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="capaian_percent"
                  value={formData.capaian_percent}
                  onChange={handleChange}
                  placeholder="95.50"
                  required
                  className="w-full px-3.5 py-2 pr-8 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Pendampingan (Opsional)
              </label>
              <input
                type="date"
                name="pendampingan_date"
                value={formData.pendampingan_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Catatan / Keterangan Evaluasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Tindak Lanjut / Asistensi
            </label>
            <textarea
              name="catatan"
              rows={3}
              value={formData.catatan}
              onChange={handleChange}
              placeholder="Catatan hambatan atau tindak lanjut pemanfaatan e-kinerja..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all clean-scrollbar"
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
