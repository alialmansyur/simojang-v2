import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Award } from 'lucide-react'
import { storePenilaianKarierData } from '../../../../services/api/pmaServicesApi'
import { SearchableInstansiSelect } from './SearchableInstansiSelect'

export function PenilaianKarierFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  initialData = null,
}) {
  const activeItem = editingItem || initialData
  const isEdit = Boolean(activeItem?.id || activeItem?.uid)

  const buildInitialForm = (item) => {
    if (item) {
      const rawDate = item.tanggal ? String(item.tanggal).split(' ')[0] : ''
      const cleanDate = rawDate && !rawDate.startsWith('0000-00-00') ? rawDate : ''
      return {
        key: item.uid || item.id || '',
        instansi: item.instansi_id || '',
        tanggal: cleanDate,
        jenis_penilaian: item.jenis_penilaian || 'Seleksi Terbuka JPT Pratama',
        total_peserta: item.total_peserta ?? '',
        memenuhi: item.memenuhi ?? '',
        tidak_memenuhi: item.tidak_memenuhi ?? '',
        lulus: item.lulus ?? '',
        tidak_lulus: item.tidak_lulus ?? '',
        tidak_hadir: item.tidak_hadir ?? 0,
      }
    }
    const today = new Date().toISOString().split('T')[0]
    return {
      key: '',
      instansi: '',
      tanggal: today,
      jenis_penilaian: 'Seleksi Terbuka JPT Pratama',
      total_peserta: '',
      memenuhi: '',
      tidak_memenuhi: '',
      lulus: '',
      tidak_lulus: '',
      tidak_hadir: 0,
    }
  }

  const [formData, setFormData] = useState(() => buildInitialForm(activeItem))
  const [prevSyncKey, setPrevSyncKey] = useState(
    () => `${isOpen ? '1' : '0'}:${activeItem?.uid || activeItem?.id || 'new'}`
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentSyncKey = `${isOpen ? '1' : '0'}:${activeItem?.uid || activeItem?.id || 'new'}`
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }

      // Auto update total if memenuhi + tidak_memenuhi changes
      if (name === 'memenuhi' || name === 'tidak_memenuhi') {
        const m = Number(name === 'memenuhi' ? value : prev.memenuhi) || 0
        const tm = Number(name === 'tidak_memenuhi' ? value : prev.tidak_memenuhi) || 0
        const th = Number(prev.tidak_hadir) || 0
        if (!prev.total_peserta || prev.total_peserta === '0') {
          updated.total_peserta = m + tm + th
        }
      }

      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.instansi) {
      setErrorMsg('Pilih instansi pengusul terlebih dahulu.')
      return
    }
    if (!formData.tanggal) {
      setErrorMsg('Tanggal penilaian karier wajib diisi.')
      return
    }
    if (!formData.jenis_penilaian) {
      setErrorMsg('Jenis penilaian karier wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storePenilaianKarierData({
        key: formData.key,
        instansi: formData.instansi,
        tanggal: formData.tanggal,
        jenis_penilaian: formData.jenis_penilaian,
        total_peserta: Number(formData.total_peserta || 0),
        memenuhi: Number(formData.memenuhi || 0),
        tidak_memenuhi: Number(formData.tidak_memenuhi || 0),
        lulus: Number(formData.lulus || 0),
        tidak_lulus: Number(formData.tidak_lulus || 0),
        tidak_hadir: Number(formData.tidak_hadir || 0),
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data Penilaian Karier.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Ubah Data Penilaian Karier' : 'Tambah Data Penilaian Karier'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Data Penilaian Karier' : 'Tambah Data Penilaian Karier'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan 40 — Uji Kelayakan & Seleksi Terbuka Karier ASN
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

        {/* Body */}
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
              initialLabel={activeItem?.instansi_nama || activeItem?.instansi_name || activeItem?.instansi}
              placeholder="Cari nama instansi pemerintah daerah..."
              required
            />
          </div>

          {/* Tanggal & Jenis Penilaian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Penilaian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Jenis Penilaian Karier <span className="text-rose-500">*</span>
              </label>
              <select
                name="jenis_penilaian"
                value={formData.jenis_penilaian}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="UD Tk 1">UD Tk 1 (Ujian Dinas Tk. I)</option>
                <option value="UD Tk 2">UD Tk 2 (Ujian Dinas Tk. II)</option>
                <option value="UPKP SLTP/SMA">UPKP SLTP/SMA</option>
                <option value="UPKP S1">UPKP S1</option>
                <option value="UPKP S2">UPKP S2</option>
                <option value="Seleksi Terbuka JPT Pratama">Seleksi Terbuka JPT Pratama</option>
                <option value="Seleksi Terbuka JPT Madya">Seleksi Terbuka JPT Madya</option>
                <option value="Uji Kelayakan Administrator">Uji Kelayakan Administrator</option>
                <option value="Uji Kompetensi Jabatan Pengawas">Uji Kompetensi Pengawas</option>
                <option value="Uji Kelayakan Mutasi Eselon III">Uji Kelayakan Mutasi Eselon III</option>
                <option value="Evaluasi Kinerja Jabatan">Evaluasi Kinerja Jabatan</option>
              </select>
            </div>
          </div>

          {/* Rincian Peserta: Total, Memenuhi, Tidak Memenuhi */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Rincian Kualifikasi Peserta
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Total Peserta</label>
                <input
                  type="number"
                  min="0"
                  name="total_peserta"
                  value={formData.total_peserta}
                  onChange={handleChange}
                  placeholder="30"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-600">Memenuhi Syarat</label>
                <input
                  type="number"
                  min="0"
                  name="memenuhi"
                  value={formData.memenuhi}
                  onChange={handleChange}
                  placeholder="25"
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-rose-600">Tidak Memenuhi</label>
                <input
                  type="number"
                  min="0"
                  name="tidak_memenuhi"
                  value={formData.tidak_memenuhi}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs font-bold text-rose-700 dark:text-rose-300"
                />
              </div>
            </div>

            {/* Rincian Kelulusan: Lulus, Tidak Lulus, Tidak Hadir */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="text-[11px] font-semibold text-emerald-600">Lulus Ujian</label>
                <input
                  type="number"
                  min="0"
                  name="lulus"
                  value={formData.lulus}
                  onChange={handleChange}
                  placeholder="20"
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-rose-600">Tidak Lulus</label>
                <input
                  type="number"
                  min="0"
                  name="tidak_lulus"
                  value={formData.tidak_lulus}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs font-bold text-rose-700 dark:text-rose-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Tidak Hadir</label>
                <input
                  type="number"
                  min="0"
                  name="tidak_hadir"
                  value={formData.tidak_hadir}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
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
