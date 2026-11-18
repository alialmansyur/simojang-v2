import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, MessageSquare } from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import { storeKonsulData } from '../../../../services/api/tuServicesApi'

export const KANAL_LAYANAN_OPTIONS = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Helpdesk', label: 'Helpdesk' },
  { value: 'Media Sosial', label: 'Media Sosial' },
  { value: 'PTSP', label: 'PTSP (Pelayanan Terpadu Satu Pintu)' },
  { value: 'Tatap Muka', label: 'Tatap Muka / Offline' },
  { value: 'Virtual Zoom', label: 'Virtual Zoom Meeting' },
  { value: 'Email', label: 'Email Resmi' },
  { value: 'Surat', label: 'Surat Permohonan' },
]

export function KonsulFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [media, setMedia] = useState('WhatsApp')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setPeriod(initialData.period || new Date().toISOString().slice(0, 7))
      setStartDate(initialData.period_start_date || new Date().toISOString().slice(0, 10))
      setEndDate(initialData.period_end_date || new Date().toISOString().slice(0, 10))
      setMedia(initialData.pelayanan || 'WhatsApp')
      setSummary(initialData.jumlah || '')
      setNotes(initialData.keterangan || '')
    } else {
      setPeriod(new Date().toISOString().slice(0, 7))
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate(new Date().toISOString().slice(0, 10))
      setMedia('WhatsApp')
      setSummary('')
      setNotes('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  const kanalOptions = useMemo(() => {
    if (!media) return KANAL_LAYANAN_OPTIONS
    const exists = KANAL_LAYANAN_OPTIONS.some(
      (opt) => opt.value.toLowerCase() === String(media).toLowerCase()
    )
    if (!exists) {
      return [{ value: media, label: media }, ...KANAL_LAYANAN_OPTIONS]
    }
    return KANAL_LAYANAN_OPTIONS
  }, [media])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!summary) {
      setErrorMsg('Harap lengkapi jumlah konsultasi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeKonsulData({
        key: initialData?.id || '',
        period,
        syncdate1: startDate,
        syncdate2: endDate,
        media,
        summary,
        notes,
      })

      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data konsultasi.')
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
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Data Konsultasi' : 'Input Data Konsultasi Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fasilitasi konsultasi kepegawaian stakeholder instansi daerah
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Periode</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kanal Layanan <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={kanalOptions}
                value={media}
                onChange={(val) => {
                  const resolved = typeof val === 'object' && val !== null ? val.value : val
                  setMedia(resolved ? String(resolved) : '')
                }}
                placeholder="-- Pilih atau cari kanal --"
                isClearable={false}
                required
              />
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jumlah Sesi / Pemohon</label>
            <input
              type="number"
              min="1"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Misal: 25"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Instansi / Topik Konsultasi</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Konsultasi penyusunan peta jabatan BKPSDM Kab. Bandung Barat"
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
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Konsultasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
