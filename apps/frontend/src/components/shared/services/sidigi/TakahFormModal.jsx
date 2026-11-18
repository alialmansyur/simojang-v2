import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import { fetchInstansiOptions, saveTakahData } from '../../../../services/api/sidigiServicesApi'

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

export function TakahFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  serviceTitle = 'Pengelolaan Dokumen Arsip Fisik (Takah)',
}) {
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [nip, setNip] = useState('')
  const [nama, setNama] = useState('')
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)

  const [d2nip, setD2nip] = useState(true)
  const [ijazah, setIjazah] = useState(true)
  const [akta, setAkta] = useState(true)
  const [drh, setDrh] = useState(true)
  const [cpns, setCpns] = useState(true)
  const [pns, setPns] = useState(true)
  const [perubahan, setPerubahan] = useState(false)
  const [kp, setKp] = useState(true)
  const [jabatan, setJabatan] = useState(true)
  const [berhenti, setBerhenti] = useState(false)
  const [pensiun, setPensiun] = useState(false)

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
      setNip(editingItem.nip_single || editingItem.nip || '')
      setNama(editingItem.nama_single || editingItem.nama || '')
      setPeriod(editingItem.period || DEFAULT_PERIOD())
      setStartDate(editingItem.period_start_date && editingItem.period_start_date !== '0000-00-00' ? editingItem.period_start_date : DEFAULT_START())
      setEndDate(editingItem.period_end_date && editingItem.period_end_date !== '0000-00-00' ? editingItem.period_end_date : DEFAULT_END())
      setD2nip(Number(editingItem.d2nip) === 1)
      setIjazah(Number(editingItem.ijazah) === 1)
      setAkta(Number(editingItem.akta) === 1)
      setDrh(Number(editingItem.drh) === 1)
      setCpns(Number(editingItem.cpns) === 1)
      setPns(Number(editingItem.pns) === 1)
      setPerubahan(Number(editingItem.perubahan) === 1)
      setKp(Number(editingItem.kp) === 1)
      setJabatan(Number(editingItem.jabatan) === 1)
      setBerhenti(Number(editingItem.berhenti) === 1)
      setPensiun(Number(editingItem.pensiun) === 1)
    } else {
      setSelectedInstansi('')
      setNip('')
      setNama('')
      setPeriod(DEFAULT_PERIOD())
      setStartDate(DEFAULT_START())
      setEndDate(DEFAULT_END())
      setD2nip(true)
      setIjazah(true)
      setAkta(true)
      setDrh(true)
      setCpns(true)
      setPns(true)
      setPerubahan(false)
      setKp(true)
      setJabatan(true)
      setBerhenti(false)
      setPensiun(false)
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

  const checklistItems = [
    { id: 'd2nip', label: 'D2NIP', val: d2nip, set: setD2nip },
    { id: 'ijazah', label: 'Ijazah & Transkrip', val: ijazah, set: setIjazah },
    { id: 'akta', label: 'Akta Kelahiran / Nikah', val: akta, set: setAkta },
    { id: 'drh', label: 'Daftar Riwayat Hidup (DRH)', val: drh, set: setDrh },
    { id: 'cpns', label: 'SK CPNS', val: cpns, set: setCpns },
    { id: 'pns', label: 'SK PNS', val: pns, set: setPns },
    { id: 'perubahan', label: 'SK Perubahan Data', val: perubahan, set: setPerubahan },
    { id: 'kp', label: 'SK Kenaikan Pangkat (KP)', val: kp, set: setKp },
    { id: 'jabatan', label: 'SK Pengangkatan Jabatan', val: jabatan, set: setJabatan },
    { id: 'berhenti', label: 'SK Pemberhentian', val: berhenti, set: setBerhenti },
    { id: 'pensiun', label: 'SK Pensiun', val: pensiun, set: setPensiun },
  ]

  const totalChecked = checklistItems.filter((i) => i.val).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nip || !nama || !selectedInstansi) {
      setErrorMsg('NIP, Nama Pegawai, dan Instansi wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await saveTakahData({
        key: editingItem?.id,
        nip,
        nama,
        instansi: selectedInstansi,
        period,
        startdate: startDate,
        enddate: endDate,
        d2nip,
        ijazah,
        akta,
        drh,
        cpns,
        pns,
        perubahan,
        kp,
        jabatan,
        berhenti,
        pensiun,
      })

      const successMsg = editingItem
        ? 'Data arsip Takah berhasil diperbarui.'
        : 'Pencatatan berkas Takah berhasil disimpan.'
      toast.success(successMsg)

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal menyimpan berkas Takah.'
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Ubah Dokumen Arsip Takah' : 'Pencatatan Dokumen Arsip Takah'}
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
                NIP Pegawai <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="198501012010011001"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap Pegawai <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama sesuai SK resmi"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Instansi Asal Pegawai <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansi}
              onChange={(val) => setSelectedInstansi(val)}
              options={instansiList}
              placeholder="-- Cari atau Pilih Instansi Asal Pegawai --"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Periode Bulan <span className="text-rose-500">*</span>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Checklist 11 Unsur Kelengkapan Berkas Fisik:
              </label>
              <span className="text-[11px] font-bold text-[#175CD3] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/40">
                {totalChecked} / 11 Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60">
              {checklistItems.map((chk) => (
                <label
                  key={chk.id}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#175CD3]"
                >
                  <input
                    type="checkbox"
                    checked={chk.val}
                    onChange={(e) => chk.set(e.target.checked)}
                    className="w-4 h-4 rounded text-[#175CD3] border-slate-300 focus:ring-[#175CD3]"
                  />
                  <span className="truncate">{chk.label}</span>
                </label>
              ))}
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
                  <span>{editingItem ? 'Perbarui Berkas Takah' : 'Simpan Berkas Takah'}</span>
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
