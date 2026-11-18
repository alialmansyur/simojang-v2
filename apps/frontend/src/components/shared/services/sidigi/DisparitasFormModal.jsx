import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import { fetchInstansiOptions, saveDisparitasData } from '../../../../services/api/sidigiServicesApi'

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

export function DisparitasFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  serviceTitle = 'Pendampingan Disparitas Data',
}) {
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [jenisAnomali, setJenisAnomali] = useState('Anomali Unor / Jabatan Struktural Kosong')
  const [jumlah, setJumlah] = useState(1)
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [keterangan, setKeterangan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setErrorMsg('')
    fetchInstansiOptions()
      .then(setInstansiList)
      .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar instansi.'))

    if (editingItem) {
      setSelectedInstansi(String(editingItem.instansi_single || editingItem.instansi_id || ''))
      setJenisAnomali(editingItem.jenis_anomali_single || editingItem.jenis_anomali || 'Anomali Unor / Jabatan Struktural Kosong')
      setJumlah(Number(editingItem.total || editingItem.jumlah || 1))
      setPeriod(editingItem.period || DEFAULT_PERIOD())
      setStartDate(editingItem.period_start_date && editingItem.period_start_date !== '0000-00-00' ? editingItem.period_start_date : DEFAULT_START())
      setEndDate(editingItem.period_end_date && editingItem.period_end_date !== '0000-00-00' ? editingItem.period_end_date : DEFAULT_END())
      setKeterangan(editingItem.keterangan || '')
    } else {
      setSelectedInstansi('')
      setJenisAnomali('Anomali Unor / Jabatan Struktural Kosong')
      setJumlah(1)
      setPeriod(DEFAULT_PERIOD())
      setStartDate(DEFAULT_START())
      setEndDate(DEFAULT_END())
      setKeterangan('')
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

      await saveDisparitasData({
        key: editingItem?.id,
        instansi: selectedInstansi,
        jenis_anomali: jenisAnomali,
        jenis: jenisAnomali,
        jumlah,
        keterangan,
        period,
        startdate: startDate,
        enddate: endDate,
      })

      const successMsg = editingItem
        ? 'Data disparitas anomali berhasil diperbarui.'
        : 'Pencatatan data disparitas anomali berhasil disimpan.'
      toast.success(successMsg)

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal menyimpan anomali disparitas.'
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Ubah Anomali Disparitas Data' : 'Pencatatan Anomali Disparitas Data'}
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
              Instansi Terdampak <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansi}
              onChange={(val) => setSelectedInstansi(val)}
              options={instansiList}
              placeholder="-- Cari atau Pilih Instansi Terdampak --"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Klasifikasi Anomali <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenisAnomali}
                onChange={(e) => setJenisAnomali(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              >
                <option value="Anomali Unor / Jabatan Struktural Kosong">Anomali Unor / Jabatan Struktural Kosong</option>
                <option value="Anomali Golongan Ruang Melebihi Ijazah">Anomali Golongan Ruang Melebihi Ijazah</option>
                <option value="Anomali Duplikasi NIP / NIK SIASN">Anomali Duplikasi NIP / NIK SIASN</option>
                <option value="Anomali Riwayat Pendidikan Belum Diverifikasi">Anomali Riwayat Pendidikan Belum Diverifikasi</option>
                <option value="Anomali Data Pensiun BUP Melebihi Batas">Anomali Data Pensiun BUP Melebihi Batas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Jumlah Pegawai Terdampak <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan / Rekomendasi Solusi
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Perlu rekonsiliasi jabatan melalui menu PDM SIASN..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
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
                  <span>{editingItem ? 'Perbarui Anomali' : 'Simpan Anomali'}</span>
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
