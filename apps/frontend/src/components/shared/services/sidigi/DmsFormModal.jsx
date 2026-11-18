import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { X, Save, Loader2, AlertCircle, Award, Users, FileCheck } from 'lucide-react'
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
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)

  // Capaian DMS metrics
  const [skorArsip, setSkorArsip] = useState('90.0')
  const [keterangan, setKeterangan] = useState('Sangat Lengkap')
  const [totalPns, setTotalPns] = useState(1000)
  const [statusCpns, setStatusCpns] = useState(5)
  const [statusPns, setStatusPns] = useState(995)
  const [sangatLengkap, setSangatLengkap] = useState(900)
  const [lengkap, setLengkap] = useState(80)
  const [cukupLengkap, setCukupLengkap] = useState(15)
  const [kurangLengkap, setKurangLengkap] = useState(5)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Auto-suggest predikat based on score
  const handleSkorChange = (val) => {
    setSkorArsip(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      if (num >= 90) setKeterangan('Sangat Lengkap')
      else if (num >= 75) setKeterangan('Lengkap')
      else if (num >= 60) setKeterangan('Cukup Lengkap')
      else setKeterangan('Kurang Lengkap')
    }
  }

  // Auto calculate status PNS = total - cpns
  const handleTotalChange = (val) => {
    const tot = Number(val || 0)
    setTotalPns(tot)
    if (tot >= statusCpns) {
      setStatusPns(tot - statusCpns)
    }
  }

  const handleCpnsChange = (val) => {
    const cpns = Number(val || 0)
    setStatusCpns(cpns)
    if (totalPns >= cpns) {
      setStatusPns(totalPns - cpns)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setErrorMsg('')
    fetchInstansiOptions()
      .then(setInstansiList)
      .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar instansi.'))

    if (editingItem) {
      setSelectedInstansi(String(editingItem.instansi_id || editingItem.kode_instansi || ''))
      setSkorArsip(
        editingItem.skor_arsip !== undefined && editingItem.skor_arsip !== null
          ? String(editingItem.skor_arsip)
          : '90.0'
      )
      setKeterangan(editingItem.keterangan || 'Sangat Lengkap')
      const tot = Number(editingItem.total_pns || editingItem.total || 0)
      const cpns = Number(editingItem.status_cpns || 0)
      setTotalPns(tot)
      setStatusCpns(cpns)
      setStatusPns(Number(editingItem.status_pns || (tot > cpns ? tot - cpns : tot)))
      setSangatLengkap(Number(editingItem.jumlah_sangat_lengkap || 0))
      setLengkap(Number(editingItem.jumlah_lengkap || 0))
      setCukupLengkap(Number(editingItem.jumlah_cukup_lengkap || 0))
      setKurangLengkap(Number(editingItem.jumlah_kurang_lengkap || 0))

      setPeriod(editingItem.period || DEFAULT_PERIOD())
      setStartDate(
        editingItem.period_start_date && editingItem.period_start_date !== '0000-00-00'
          ? editingItem.period_start_date
          : DEFAULT_START()
      )
      setEndDate(
        editingItem.period_end_date && editingItem.period_end_date !== '0000-00-00'
          ? editingItem.period_end_date
          : DEFAULT_END()
      )
    } else {
      setSelectedInstansi('')
      setSkorArsip('90.0')
      setKeterangan('Sangat Lengkap')
      setTotalPns(1000)
      setStatusCpns(5)
      setStatusPns(995)
      setSangatLengkap(900)
      setLengkap(80)
      setCukupLengkap(15)
      setKurangLengkap(5)

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
      setErrorMsg('Pilih instansi daerah terlebih dahulu.')
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
        skor_arsip: parseFloat(skorArsip) || 0,
        keterangan,
        total_pns: Number(totalPns || 0),
        status_cpns: Number(statusCpns || 0),
        status_pns: Number(statusPns || 0),
        jumlah_sangat_lengkap: Number(sangatLengkap || 0),
        jumlah_lengkap: Number(lengkap || 0),
        jumlah_cukup_lengkap: Number(cukupLengkap || 0),
        jumlah_kurang_lengkap: Number(kurangLengkap || 0),
        items: [{ jenis: 'Capaian Digitalisasi Arsip', total: Number(totalPns || 0) }],
      })

      const successMsg = editingItem
        ? 'Capaian DMS instansi berhasil diperbarui.'
        : 'Pencatatan data capaian DMS berhasil disimpan.'
      toast.success(successMsg)

      if (onSuccess) onSuccess(successMsg)
      onClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal menyimpan data capaian digitalisasi DMS.'
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Ubah Capaian Digitalisasi Arsip (DMS)' : 'Pencatatan Capaian Digitalisasi Arsip (DMS)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {serviceTitle} • Kantor Regional III BKN
              </p>
            </div>
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

          {/* Instansi Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Instansi Daerah <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansi}
              onChange={(val) => setSelectedInstansi(val)}
              options={instansiList}
              placeholder="-- Cari atau Pilih Instansi Daerah --"
              required
            />
          </div>

          {/* Periode & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Periode Data <span className="text-rose-500">*</span>
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
                Tanggal Sinkronisasi
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

          {/* Section 1: Skor Arsip & Predikat */}
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Penilaian Indeks & Predikat Kelengkapan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rata-rata Skor Arsip (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={skorArsip}
                    onChange={(e) => handleSkorChange(e.target.value)}
                    required
                    placeholder="Contoh: 98.5"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Predikat Keterangan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                >
                  <option value="Sangat Lengkap">Sangat Lengkap (Skor ≥ 90%)</option>
                  <option value="Lengkap">Lengkap (Skor 75% - 89.9%)</option>
                  <option value="Cukup Lengkap">Cukup Lengkap (Skor 60% - 74.9%)</option>
                  <option value="Kurang Lengkap">Kurang Lengkap (Skor &lt; 60%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Populasi Pegawai */}
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Populasi Pegawai ASN Dinilai</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Total Pegawai (PNS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalPns}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status CPNS
                </label>
                <input
                  type="number"
                  min="0"
                  value={statusCpns}
                  onChange={(e) => handleCpnsChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status PNS Aktif
                </label>
                <input
                  type="number"
                  min="0"
                  value={statusPns}
                  onChange={(e) => setStatusPns(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Sebaran Kelengkapan Berkas */}
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Rincian Sebaran Kelengkapan Dokumen</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  Sangat Lengkap
                </label>
                <input
                  type="number"
                  min="0"
                  value={sangatLengkap}
                  onChange={(e) => setSangatLengkap(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">
                  Lengkap
                </label>
                <input
                  type="number"
                  min="0"
                  value={lengkap}
                  onChange={(e) => setLengkap(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                  Cukup Lengkap
                </label>
                <input
                  type="number"
                  min="0"
                  value={cukupLengkap}
                  onChange={(e) => setCukupLengkap(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                  Kurang Lengkap
                </label>
                <input
                  type="number"
                  min="0"
                  value={kurangLengkap}
                  onChange={(e) => setKurangLengkap(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>

          {/* Tombol Aksi */}
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
                  <span>{editingItem ? 'Perbarui Capaian DMS' : 'Simpan Capaian DMS'}</span>
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
