import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import { fetchInstansiOptions, saveDmsData } from '../../../../services/api/sidigiServicesApi'

const DEFAULT_PERIOD = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const DEFAULT_START = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const DEFAULT_END = () => {
  const d = new Date()
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

export function DmsFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  serviceTitle = 'Digitalisasi Arsip Kepegawaian (DMS)',
}) {
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [jenis, setJenis] = useState('Arsip Elektronik (PNS)')
  const [total, setTotal] = useState(1)
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setErrorMsg('')
    fetchInstansiOptions()
      .then(setInstansiList)
      .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar instansi.'))

    if (editingItem) {
      setSelectedInstansi(String(editingItem.instansi_id || editingItem.kode_instansi || ''))
      setJenis(editingItem.jenis || 'Arsip Elektronik (PNS)')
      setTotal(Number(editingItem.total || 0))
      setPeriod(editingItem.period || DEFAULT_PERIOD())
      setStartDate(editingItem.period_start_date && editingItem.period_start_date !== '0000-00-00' ? editingItem.period_start_date : DEFAULT_START())
      setEndDate(editingItem.period_end_date && editingItem.period_end_date !== '0000-00-00' ? editingItem.period_end_date : DEFAULT_END())
    } else {
      setSelectedInstansi('')
      setJenis('Arsip Elektronik (PNS)')
      setTotal(1)
      setPeriod(DEFAULT_PERIOD())
      setStartDate(DEFAULT_START())
      setEndDate(DEFAULT_END())
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
      setErrorMsg('Pilih instansi asal dokumen terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await saveDmsData({
        key: editingItem?.id,
        instansi: selectedInstansi,
        period,
        startdate: startDate,
        enddate: endDate,
        items: [{ jenis, total }],
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data digitalisasi DMS.')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Ubah Data Digitalisasi Arsip (DMS)' : 'Pencatatan Digitalisasi Arsip (DMS)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {serviceTitle} • Kantor Regional III BKN
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Instansi Asal Dokumen <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansi}
              onChange={(val) => setSelectedInstansi(val)}
              options={instansiList}
              placeholder="-- Cari atau Pilih Instansi Asal --"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenis Dokumen Digital <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              >
                <option value="Arsip Elektronik (PNS)">Arsip Elektronik (PNS)</option>
                <option value="E-SK Pangkat & Jabatan">E-SK Pangkat & Jabatan</option>
                <option value="E-Ijazah & Transkrip Nilai">E-Ijazah & Transkrip Nilai</option>
                <option value="E-Karis / Karsu / Karpeg">E-Karis / Karsu / Karpeg</option>
                <option value="E-SK Pensiun & Hak Janda/Duda">E-SK Pensiun & Hak Janda/Duda</option>
                <option value="E-Dokumen Peremajaan Lainnya">E-Dokumen Peremajaan Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Dokumen Discan <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

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
                  <span>{editingItem ? 'Perbarui Data DMS' : 'Simpan Data DMS'}</span>
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
