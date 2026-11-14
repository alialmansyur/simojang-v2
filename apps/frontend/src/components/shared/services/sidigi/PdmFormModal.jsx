import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { savePdmData } from '../../../../services/api/sidigiServicesApi'

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

export function PdmFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  serviceTitle = 'Peremajaan Data ASN (PDM)',
}) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [jenis, setJenis] = useState('Riwayat Pendidikan')
  const [acc, setAcc] = useState(0)
  const [btl, setBtl] = useState(0)
  const [tms, setTms] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setErrorMsg('')
    if (editingItem) {
      setPeriod(editingItem.period || DEFAULT_PERIOD())
      setStartDate(editingItem.period_start_date && editingItem.period_start_date !== '0000-00-00' ? editingItem.period_start_date : DEFAULT_START())
      setEndDate(editingItem.period_end_date && editingItem.period_end_date !== '0000-00-00' ? editingItem.period_end_date : DEFAULT_END())
      setJenis(editingItem.jenis || 'Riwayat Pendidikan')
      setAcc(Number(editingItem.total_acc || 0))
      setBtl(Number(editingItem.total_btl || 0))
      setTms(Number(editingItem.total_tms || 0))
    } else {
      setPeriod(DEFAULT_PERIOD())
      setStartDate(DEFAULT_START())
      setEndDate(DEFAULT_END())
      setJenis('Riwayat Pendidikan')
      setAcc(0)
      setBtl(0)
      setTms(0)
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

  const totalUsul = Number(acc || 0) + Number(btl || 0) + Number(tms || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (totalUsul <= 0) {
      setErrorMsg('Minimal salah satu dari jumlah ACC, BTL, atau TMS harus lebih besar dari 0.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await savePdmData({
        key: editingItem?.id,
        period,
        startdate: startDate,
        enddate: endDate,
        items: [{ jenis, acc, btl, tms }],
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data peremajaan.')
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
              {editingItem ? 'Ubah Peremajaan Data ASN' : 'Entry Peremajaan Data ASN'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Periode Laporan (Bulan/Tahun) <span className="text-rose-500">*</span>
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
                Jenis Riwayat PDM <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              >
                <option value="Riwayat Pendidikan">Riwayat Pendidikan</option>
                <option value="Riwayat Golongan/Pangkat">Riwayat Golongan/Pangkat</option>
                <option value="Riwayat Jabatan">Riwayat Jabatan</option>
                <option value="Riwayat Diklat/Kursus">Riwayat Diklat/Kursus</option>
                <option value="Riwayat SKP/Kinerja">Riwayat SKP/Kinerja</option>
                <option value="Riwayat Keluarga">Riwayat Keluarga</option>
                <option value="Riwayat PMK">Riwayat PMK</option>
                <option value="Riwayat Angka Kredit">Riwayat Angka Kredit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Mulai Tarikan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Selesai Tarikan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                Total ACC (Disetujui)
              </label>
              <input
                type="number"
                min="0"
                value={acc}
                onChange={(e) => setAcc(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 text-xs text-emerald-900 dark:text-emerald-200 text-right font-bold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                Total BTL (Perbaikan)
              </label>
              <input
                type="number"
                min="0"
                value={btl}
                onChange={(e) => setBtl(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/30 text-xs text-amber-900 dark:text-amber-200 text-right font-bold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1.5">
                Total TMS (Ditolak)
              </label>
              <input
                type="number"
                min="0"
                value={tms}
                onChange={(e) => setTms(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/30 text-xs text-rose-900 dark:text-rose-200 text-right font-bold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Total Usulan PDM:</span>
            <span className="font-extrabold text-[#175CD3] dark:text-blue-400 text-sm">
              {new Intl.NumberFormat('id-ID').format(totalUsul)} Berkas Usul
            </span>
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
                  <span>{editingItem ? 'Perbarui Data PDM' : 'Simpan Data PDM'}</span>
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
