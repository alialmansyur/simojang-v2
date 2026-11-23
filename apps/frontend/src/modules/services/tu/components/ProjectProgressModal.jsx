import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Camera, TrendingUp, AlertCircle } from 'lucide-react'
import { storeProjectProgress } from '../../../../services/api/tuServicesApi'

export function ProjectProgressModal({ isOpen, onClose, onSuccess, projectUid, initialData }) {
  const [title, setTitle] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [targetPercentage, setTargetPercentage] = useState('')
  const [actualPercentage, setActualPercentage] = useState('')
  const [notes, setNotes] = useState('')
  const [foto, setFoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setLogDate(initialData.log_date || new Date().toISOString().slice(0, 10))
      setStartDate(initialData.start_date || '')
      setEndDate(initialData.end_date || '')
      setTargetPercentage(initialData.target_percentage ?? '')
      setActualPercentage(initialData.actual_percentage ?? '')
      setNotes(initialData.notes || '')
      setPreviewUrl(initialData.foto_url || '')
    } else {
      setTitle('')
      setLogDate(new Date().toISOString().slice(0, 10))
      setStartDate('')
      setEndDate('')
      setTargetPercentage('')
      setActualPercentage('')
      setNotes('')
      setFoto(null)
      setPreviewUrl('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFoto(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  // Calculate live deviation
  const numTarget = targetPercentage !== '' ? parseFloat(targetPercentage) : null
  const numActual = actualPercentage !== '' ? parseFloat(actualPercentage) : null
  const deviasi = numTarget !== null && numActual !== null && !isNaN(numTarget) && !isNaN(numActual)
    ? (numActual - numTarget).toFixed(2)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!actualPercentage && actualPercentage !== 0) {
      setErrorMsg('Persentase progres fisik aktual wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const fd = new FormData()
      fd.append('project_uid', projectUid)
      if (initialData?.id) fd.append('id', initialData.id)
      fd.append('title', title.trim())
      fd.append('log_date', logDate)
      if (startDate) fd.append('start_date', startDate)
      if (endDate) fd.append('end_date', endDate)
      fd.append('target_percentage', targetPercentage !== '' ? targetPercentage : '0')
      fd.append('actual_percentage', actualPercentage)
      fd.append('notes', notes.trim())
      if (foto) fd.append('foto', foto)

      const res = await storeProjectProgress(fd)
      if (res?.status === 'success' || res?.status === true) {
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error(res?.message || 'Gagal menyimpan log progres fisik.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan log progres fisik.')
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header (Matching /layanan/cltn) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-[#F8FAFC] dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Catatan Progres Fisik' : 'Catat Log Progres Fisik Lapangan'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumentasi milestone pekerjaan dan persentase capaian riil
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Judul Milestone / Item Pekerjaan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Pengecoran pondasi dak server / Instalasi ducting AC"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
            />
          </div>

          {/* Tanggal & Periode Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Update <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Periode Awal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Periode Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
          </div>

          {/* Target (%) vs Realisasi Aktual (%) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Progres Rencana (%)
                  </label>
                  <span className="text-[10px] text-slate-400">Kumulatif</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(e.target.value)}
                  placeholder="Contoh: 45.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                />
                <span className="text-[10px] text-slate-400 block">Target kurva rencana (%)</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Realisasi Aktual (%) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Fisik Riil</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={actualPercentage}
                  onChange={(e) => setActualPercentage(e.target.value)}
                  placeholder="Contoh: 47.50"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                />
                <span className="text-[10px] text-slate-400 block">Capaian fisik riil lapangan (%)</span>
              </div>
            </div>

            {/* Indikator Deviasi Real-time */}
            {deviasi !== null && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-[11px]">Kalkulasi Deviasi Progres:</span>
                {parseFloat(deviasi) >= 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                    +{deviasi}% (Ahead of Schedule / On Track)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60">
                    {deviasi}% (Behind Schedule / Terlambat)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Progres, Hambatan & Solusi Lapangan
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deskripsikan kondisi lapangan, kesesuaian material, dan catatan inspeksi..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          {/* Upload Foto Dokumentasi Lapangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Foto Dokumentasi Lapangan (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                <Camera className="w-4 h-4 text-[#175CD3]" />
                <span>Pilih Foto</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {previewUrl && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (Matching /layanan/cltn) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Log Progres'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ProjectProgressModal
