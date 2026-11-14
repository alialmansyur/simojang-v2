import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Star, Calendar, Users, FileText } from 'lucide-react'
import { storeIkmData } from '../../../../services/api/tuServicesApi'

export function IkmFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [period, setPeriod] = useState(new Date().getFullYear().toString())
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [jenis, setJenis] = useState('TOTAL')
  const [nilai, setNilai] = useState('')
  const [responder, setResponder] = useState('')
  const [sumberData, setSumberData] = useState('Survei IKM Terpadu BKN')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setPeriod(initialData.period || new Date().getFullYear().toString())
      setStartDate(initialData.period_start_date || new Date().toISOString().slice(0, 10))
      setEndDate(initialData.period_end_date || new Date().toISOString().slice(0, 10))
      setJenis(initialData.jenis || 'TOTAL')
      setNilai(initialData.nilai || '')
      setResponder(initialData.jumlah_responden || '')
      setSumberData(initialData.sumber_data || 'Survei IKM Terpadu BKN')
    } else {
      setPeriod(new Date().getFullYear().toString())
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate(new Date().toISOString().slice(0, 10))
      setJenis('TOTAL')
      setNilai('')
      setResponder('')
      setSumberData('Survei IKM Terpadu BKN')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nilai || !responder) {
      setErrorMsg('Harap lengkapi nilai survei dan jumlah responden.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeIkmData({
        key: initialData?.id || '',
        period,
        syncdate1: startDate,
        syncdate2: endDate,
        jenis,
        nilai,
        responder,
        sumber_data: sumberData,
      })

      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data survei IKM.')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Hasil Survei IKM' : 'Input Hasil Survei IKM Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indeks Kepuasan Masyarakat pelayanan Kantor Regional III BKN
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahun Periode</label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori Layanan</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="TOTAL">TOTAL (Seluruh Layanan)</option>
                <option value="LAYANAN">Pelayanan Kepegawaian</option>
                <option value="PEMBINAAN">Pembinaan & Fasilitasi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nilai IKM (Skala 0 - 100)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Misal: 91.45"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jumlah Responden</label>
              <input
                type="number"
                min="1"
                value={responder}
                onChange={(e) => setResponder(e.target.value)}
                placeholder="Misal: 250"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sumber Data / Instrumen Survei</label>
            <input
              type="text"
              value={sumberData}
              onChange={(e) => setSumberData(e.target.value)}
              placeholder="Misal: Kuesioner Digital PTSP Kanreg III BKN"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          {/* Footer Actions (Matching /layanan/cltn) */}
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
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Hasil Survei'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
