import { useState, useEffect } from 'react'
import {
  X,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { storeIkkIndikatorRealisasi } from '../../../../services/api/tuServicesApi'

const BULAN_OPTIONS = [
  { value: '1', label: 'Bulan 1 - Januari' },
  { value: '2', label: 'Bulan 2 - Februari' },
  { value: '3', label: 'Bulan 3 - Maret' },
  { value: '4', label: 'Bulan 4 - April' },
  { value: '5', label: 'Bulan 5 - Mei' },
  { value: '6', label: 'Bulan 6 - Juni' },
  { value: '7', label: 'Bulan 7 - Juli' },
  { value: '8', label: 'Bulan 8 - Agustus' },
  { value: '9', label: 'Bulan 9 - September' },
  { value: '10', label: 'Bulan 10 - Oktober' },
  { value: '11', label: 'Bulan 11 - November' },
  { value: '12', label: 'Bulan 12 - Desember' },
]

export function IkkRealizationModal({
  isOpen,
  onClose,
  onSuccess,
  item = null,
  currentTahun = '2026',
  currentBulan = '9',
  currentTriwulan = '3',
}) {
  const [tahun, setTahun] = useState(currentTahun)
  const [bulan, setBulan] = useState(currentBulan || '9')
  const [triwulan, setTriwulan] = useState(currentTriwulan || '3')
  const [targetPeriode, setTargetPeriode] = useState('')
  const [realisasiText, setRealisasiText] = useState('')
  const [capaianText, setCapaianText] = useState('')
  const [penjelasan, setPenjelasan] = useState('')
  const [permasalahan, setPermasalahan] = useState('')
  const [rencanaTindakLanjut, setRencanaTindakLanjut] = useState('')
  const [buktiDukung, setBuktiDukung] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (item) {
      setTahun(String(item.tahun || currentTahun))
      const b = String(item.bulan || currentBulan || '9')
      setBulan(b)
      setTriwulan(String(item.triwulan || Math.ceil(Number(b) / 3) || '3'))
      setTargetPeriode(item.target_periode || item.target_tahunan || '')
      setRealisasiText(item.realisasi !== '-' ? item.realisasi : '')
      setCapaianText(item.capaian !== '-' ? item.capaian : '')
      setPenjelasan(item.penjelasan_capaian || '')
      setPermasalahan(item.permasalahan || '')
      setRencanaTindakLanjut(item.rencana_tindak_lanjut || '')
      setBuktiDukung(item.bukti_dukung || '')
    } else {
      setTahun(currentTahun)
      setBulan(currentBulan || '9')
      setTriwulan(currentTriwulan || '3')
      setTargetPeriode('')
      setRealisasiText('')
      setCapaianText('')
      setPenjelasan('')
      setPermasalahan('')
      setRencanaTindakLanjut('')
      setBuktiDukung('')
    }
    setErrorMessage('')
  }, [item, currentTahun, currentBulan, currentTriwulan, isOpen])

  if (!isOpen || !item) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!targetPeriode.trim()) {
      setErrorMessage('Kolom Target wajib diisi.')
      return
    }
    if (!realisasiText.trim()) {
      setErrorMessage('Kolom Realisasi wajib diisi.')
      return
    }
    if (!capaianText.trim()) {
      setErrorMessage('Kolom Capaian wajib diisi.')
      return
    }
    if (!penjelasan.trim()) {
      setErrorMessage('Kolom Penjelasan / Progres Capaian wajib diisi.')
      return
    }
    if (!permasalahan.trim()) {
      setErrorMessage('Kolom Permasalahan / Kendala wajib diisi.')
      return
    }
    if (!rencanaTindakLanjut.trim()) {
      setErrorMessage('Kolom Rencana Tindak Lanjut wajib diisi.')
      return
    }
    if (!buktiDukung.trim()) {
      setErrorMessage('Kolom Link Bukti Dukung (Google Drive / Eviden) wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        indikator_id: item.id,
        tahun: tahun,
        bulan: bulan,
        triwulan: triwulan,
        target_periode: targetPeriode,
        realisasi_text: realisasiText,
        capaian_text: capaianText,
        penjelasan_capaian: penjelasan,
        permasalahan: permasalahan,
        rencana_tindak_lanjut: rencanaTindakLanjut,
        bukti_dukung: buktiDukung,
        ...(item.log_id ? { log_id: item.log_id } : {}),
      }

      const res = await storeIkkIndikatorRealisasi(payload)
      if (res?.status === 'success') {
        toast.success(res.message || 'Data realisasi IKK berhasil disimpan!')
        onClose()
        onSuccess && onSuccess()
      } else {
        setErrorMessage(res?.message || 'Gagal menyimpan data realisasi IKK.')
      }
    } catch (err) {
      console.warn('Gagal menyimpan realisasi IKK:', err)
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#175CD3] text-white">
                {item.kode}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Satuan: {item.satuan} | Target Master: {item.target_tahunan}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              {item.nama_indikator}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto clean-scrollbar text-xs flex-1">
            {/* Periode Bar (Tahun, Bulan, Triwulan) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tahun Anggaran <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bulan Pelaporan <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={bulan}
                  onChange={(e) => {
                    const val = e.target.value
                    setBulan(val)
                    setTriwulan(String(Math.ceil(Number(val) / 3)))
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Periode Triwulan:
                </label>
                <select
                  value={triwulan}
                  onChange={(e) => setTriwulan(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="1">Triwulan I</option>
                  <option value="2">Triwulan II (Semester I)</option>
                  <option value="3">Triwulan III</option>
                  <option value="4">Triwulan IV (Tahunan)</option>
                </select>
              </div>
            </div>

            {/* Target, Realisasi & Capaian (3 Kolom Wajib) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Periode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetPeriode}
                  onChange={(e) => setTargetPeriode(e.target.value)}
                  placeholder="Misal: 97 atau NA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Realisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={realisasiText}
                  onChange={(e) => setRealisasiText(e.target.value)}
                  placeholder="Misal: 98.13 atau NA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Capaian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={capaianText}
                  onChange={(e) => setCapaianText(e.target.value)}
                  placeholder="Misal: 101.16% atau NA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>

            {/* 4. Penjelasan Progres */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Penjelasan / Progres Capaian <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={penjelasan}
                onChange={(e) => setPenjelasan(e.target.value)}
                placeholder="Uraikan detail perkembangan dan progres capaian indikator pada bulan/triwulan ini..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-y"
              />
            </div>

            {/* 5. Permasalahan */}
            <div>
              <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
                Permasalahan / Kendala <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={permasalahan}
                onChange={(e) => setPermasalahan(e.target.value)}
                placeholder="Catat kendala teknis atau faktor eksternal yang dihadapi (isi '-' jika tidak ada kendala)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-y"
              />
            </div>

            {/* 6. Rencana Tindak Lanjut */}
            <div>
              <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                Rencana Tindak Lanjut <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={rencanaTindakLanjut}
                onChange={(e) => setRencanaTindakLanjut(e.target.value)}
                placeholder="Langkah evaluasi dan rencana aksi strategis untuk periode berikutnya..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-y"
              />
            </div>

            {/* 7. Link Bukti Dukung */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Link Bukti Dukung (Google Drive / URL Eviden) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={buktiDukung}
                onChange={(e) => setBuktiDukung(e.target.value)}
                placeholder="https://drive.google.com/... atau tautan eviden resmi lainnya"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Capaian</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
