import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, AlertCircle, Calendar, Hash, Building2, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateCatSession } from '../../../../../services/api/sidigiCatServicesApi'

export function CatSessionEditModal(props) {
  if (!props.isOpen || !props.session) return null
  const sessionKey = props.session.id || props.session.uid || 'edit'
  return <CatSessionEditModalContent key={sessionKey} {...props} />
}

function CatSessionEditModalContent({ onClose, session, onSuccess }) {
  const parseDateForInput = (dateVal) => {
    if (!dateVal) return ''
    if (typeof dateVal === 'string') {
      if (dateVal.includes('T')) return dateVal.split('T')[0]
      if (dateVal.includes(' ')) return dateVal.split(' ')[0]
      return dateVal
    }
    return ''
  }

  const [formData, setFormData] = useState(() => ({
    tanggal: parseDateForInput(session.period_date || session.tanggal),
    sesi: session.sesi !== undefined && session.sesi !== null ? session.sesi : 1,
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
    setErrorMsg('')

    if (!formData.tanggal) {
      setErrorMsg('Tanggal pelaksanaan wajib diisi.')
      return
    }

    if (!formData.sesi || Number(formData.sesi) <= 0) {
      setErrorMsg('Nomor sesi ujian harus berupa angka lebih besar dari 0.')
      return
    }

    if (
      formData.nilai_min !== '' &&
      formData.nilai_max !== '' &&
      Number(formData.nilai_min) > Number(formData.nilai_max)
    ) {
      setErrorMsg('Nilai minimum tidak boleh lebih besar dari nilai maksimum.')
      return
    }

    setIsSubmitting(true)

    try {
      await updateCatSession({
        id: session.id,
        key: session.id || session.uid,
        instansi: session.instansi_id || session.instansi,
        tanggal: formData.tanggal,
        sesi: Number(formData.sesi) || 1,
        hadir: Number(formData.hadir) || 0,
        tidak_hadir: Number(formData.tidak_hadir) || 0,
        reschedule: Number(formData.reschedule) || 0,
        nilai_min: formData.nilai_min !== '' ? formData.nilai_min : 0,
        nilai_max: formData.nilai_max !== '' ? formData.nilai_max : 0,
        memenuhi: Number(formData.memenuhi) || 0,
        tidak_memenuhi: Number(formData.tidak_memenuhi) || 0,
      })

      toast.success('Data sesi CAT berhasil diperbarui.')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan pembaruan sesi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPeserta = (Number(formData.hadir) || 0) + (Number(formData.tidak_hadir) || 0)
  const pctHadir = totalPeserta > 0 ? Math.round(((Number(formData.hadir) || 0) / totalPeserta) * 100) : 0

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
              Sesi {formData.sesi || session.sesi} • {session.instansi_nama || 'Instansi Terdaftar'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

          {/* Context Info Banner */}
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium text-slate-400">Instansi:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{session.instansi_nama || '-'}</span>
            </div>
            {(session.nama_tilok || session.tilok_nama) && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-400">Titik Lokasi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{session.nama_tilok || session.tilok_nama}</span>
              </div>
            )}
          </div>

          {/* Tanggal & Sesi Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sesi Ujian <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  name="sesi"
                  value={formData.sesi}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                />
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

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              Tingkat Kehadiran: <span className="font-bold text-blue-600 dark:text-blue-400">{pctHadir}%</span>
            </span>
            <span>
              Total Alokasi: <span className="font-bold text-slate-800 dark:text-slate-200">{totalPeserta}</span> orang
            </span>
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
