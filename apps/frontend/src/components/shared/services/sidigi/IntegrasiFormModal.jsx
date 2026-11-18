import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { X, Save, Loader2, AlertCircle, Link as LinkIcon, Video } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import {
  fetchInstansiOptions,
  fetchIntegrasiSteps,
  saveIntegrasiData,
} from '../../../../services/api/sidigiServicesApi'

export function IntegrasiFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  serviceTitle = 'Integrasi SIASN dengan SIMPEG',
}) {
  const [instansiList, setInstansiList] = useState([])
  const [steps, setSteps] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [selectedStep, setSelectedStep] = useState(1)
  const [period, setPeriod] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [remarks, setRemarks] = useState('')
  const [buktiDukung, setBuktiDukung] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchInstansiOptions()
        .then(setInstansiList)
        .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar instansi.'))
      fetchIntegrasiSteps()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) setSteps(res)
        })
        .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar tahapan integrasi.'))
      if (editingItem) {
        setSelectedInstansi(editingItem.instansi_id || editingItem.kodeins || '')
        setSelectedStep(Number(editingItem.rw_integrasi_id || editingItem.step_id || 1))
        if (editingItem.period) setPeriod(editingItem.period)
        if (editingItem.period_date || editingItem.startdate) {
          setStartDate(editingItem.period_date || editingItem.startdate)
        }
        if (editingItem.remarks) setRemarks(editingItem.remarks)
        if (editingItem.bukti_dukung) setBuktiDukung(editingItem.bukti_dukung)
        if (editingItem.video_url) setVideoUrl(editingItem.video_url)
      } else {
        setSelectedInstansi('')
        setSelectedStep(1)
        setRemarks('')
        setBuktiDukung('')
        setVideoUrl('')
      }
    }
  }, [isOpen, editingItem])

  useEffect(() => {
    if (!isOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedInstansi) {
      setErrorMsg('Pilih instansi pemerintah daerah terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await saveIntegrasiData({
        key: editingItem?.id,
        instansi: selectedInstansi,
        step: selectedStep,
        riwayat: [selectedStep],
        period,
        startdate: startDate,
        remarks: remarks || 'Status Integrasi Sistem',
        bukti_dukung: buktiDukung,
        video_url: videoUrl || buktiDukung || 'https://siasn.bkn.go.id',
      })

      const successMsg = editingItem
        ? 'Status integrasi instansi berhasil diperbarui.'
        : 'Pencatatan tahapan integrasi berhasil disimpan.'
      toast.success(successMsg)

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal menyimpan status integrasi.'
      setErrorMsg(errMsg)
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header - Matching /layanan/cltn */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pendampingan Integrasi SIASN
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {serviceTitle} • Kantor Regional III BKN
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Instansi Pemerintah Daerah <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansi}
              onChange={(val) => setSelectedInstansi(val)}
              options={instansiList}
              placeholder="-- Cari atau Pilih Instansi (Jabar & Banten) --"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Modul Riwayat Integrasi SIASN <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            >
              {steps.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.text || st.jenis || `Riwayat ${st.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Periode Sinkronisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Pendampingan / Status Teknis
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Contoh: Pengujian endpoint data riwayat jabatan selesai tanpa error..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tautan Bukti Dukung (G-Drive / Cloud)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={buktiDukung}
                  onChange={(e) => setBuktiDukung(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tautan Rekaman / Video Sosialisasi
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>
          </div>

          {/* Footer actions - Matching /layanan/cltn */}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Progres</span>
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
