import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, UserCheck, Calendar, Clock, AlertCircle, CheckCircle2, Loader2, Briefcase, FileText } from 'lucide-react'
import { saveEkinManual } from '../../../../services/api/tuServicesApi'

const SUB_UNIT_OPTIONS = [
  'Subbagian Kepegawaian Kantor Regional III BKN',
  'Subbagian Perencanaan dan Keuangan Kantor Regional III BKN',
  'Subbagian Umum Kantor Regional III BKN',
  'Bagian Tata Usaha Kantor Regional III BKN',
  'Unit Penyelenggara Seleksi Calon dan Penilaian Kompetensi Pegawai Aparatur Sipil Negara Serang',
]

export function EkinFormModal({
  isOpen,
  onClose,
  onSuccess,
  item = null,
  initialData = null,
  initialDate = '',
}) {
  const editItem = item || initialData
  const [formData, setFormData] = useState({
    id: '',
    sub_unit: SUB_UNIT_OPTIONS[0],
    tanggal_kegiatan: new Date().toISOString().slice(0, 10),
    nip: '',
    nama: '',
    waktu: '08:00 - 16:00',
    kegiatan: '',
    realisasi: '1',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setSuccessMsg('')
      if (editItem) {
        setFormData({
          id: editItem.id || '',
          sub_unit: editItem.sub_unit || SUB_UNIT_OPTIONS[0],
          tanggal_kegiatan: editItem.tanggal_kegiatan || editItem.period_date || initialDate || new Date().toISOString().slice(0, 10),
          nip: editItem.nip || '',
          nama: editItem.nama || '',
          waktu: editItem.waktu || '08:00 - 16:00',
          kegiatan: editItem.kegiatan || '',
          realisasi: String(editItem.realisasi || '1'),
        })
      } else {
        setFormData({
          id: '',
          sub_unit: SUB_UNIT_OPTIONS[0],
          tanggal_kegiatan: initialDate || new Date().toISOString().slice(0, 10),
          nip: '',
          nama: '',
          waktu: '08:00 - 16:00',
          kegiatan: '',
          realisasi: '1',
        })
      }
    }
  }, [isOpen, editItem, initialDate])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nip || !/^\d{18}$/.test(formData.nip.trim())) {
      setErrorMsg('NIP pegawai wajib terdiri dari 18 digit angka.')
      return
    }

    if (!formData.kegiatan.trim()) {
      setErrorMsg('Uraian kegiatan wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      setSuccessMsg('')

      const res = await saveEkinManual({
        id: formData.id || undefined,
        sub_unit: formData.sub_unit,
        tanggal_kegiatan: formData.tanggal_kegiatan,
        nip: formData.nip.trim(),
        waktu: formData.waktu.trim(),
        kegiatan: formData.kegiatan.trim(),
        realisasi: formData.realisasi,
      })

      if (res?.status === 'success' || res?.status === true) {
        setSuccessMsg(res?.message || 'Data kegiatan E-Kinerja berhasil disimpan.')
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1000)
      } else {
        throw new Error(res?.message || 'Gagal menyimpan data kegiatan.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menyimpan data.')
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formData.id ? 'Ubah Kegiatan E-Kinerja' : 'Entri Kegiatan E-Kinerja'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan manual aktivitas kinerja harian pegawai
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto clean-scrollbar flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sub Unit */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sub Unit Kerja <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                name="sub_unit"
                value={formData.sub_unit}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              >
                {SUB_UNIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Kegiatan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="tanggal_kegiatan"
                  value={formData.tanggal_kegiatan}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rentang Waktu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="waktu"
                value={formData.waktu}
                onChange={handleChange}
                placeholder="Contoh: 08:00 - 11:30"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          {/* NIP Pegawai */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              NIP Pegawai (18 Digit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              maxLength={18}
              placeholder="Contoh: 199007152015032003"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
            <p className="text-[11px] text-slate-400">
              Nama pegawai akan disinkronkan otomatis dari database kepegawaian internal.
            </p>
          </div>

          {/* Uraian Kegiatan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Uraian Aktivitas / Kegiatan <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="kegiatan"
              value={formData.kegiatan}
              onChange={handleChange}
              rows={3}
              placeholder="Tuliskan rincian tugas atau aktivitas yang dilaksanakan..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 leading-relaxed"
            />
          </div>

          {/* Status Realisasi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Status Capaian Realisasi <span className="text-rose-500">*</span>
            </label>
            <select
              name="realisasi"
              value={formData.realisasi}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            >
              <option value="1">Selesai (100% Tercapai)</option>
              <option value="0">Dalam Proses / Sebagian</option>
            </select>
          </div>

          {/* Footer Action inside form */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kegiatan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
