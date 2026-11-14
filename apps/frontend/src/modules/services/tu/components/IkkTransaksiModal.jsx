import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Award, AlertTriangle, Layers, Target, CheckCircle2 } from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import {
  storeIkkTransaksi,
  fetchIkkOptionsSasaran,
  fetchIkkOptionsIndikator,
  fetchIkkOptionsKegiatan,
} from '../../../../services/api/tuServicesApi'

export function IkkTransaksiModal({ isOpen, onClose, onSuccess, initialData }) {
  const today = new Date().toISOString().slice(0, 10)
  const [sasaranId, setSasaranId] = useState('')
  const [indikatorId, setIndikatorId] = useState('')
  const [kegiatanId, setKegiatanId] = useState('')
  const [pelaksanaHarian, setPelaksanaHarian] = useState('')
  const [periodStartDate, setPeriodStartDate] = useState(today)
  const [periodEndDate, setPeriodEndDate] = useState(today)
  const [targetMingguan, setTargetMingguan] = useState('100')
  const [jumlahRealisasi, setJumlahRealisasi] = useState('0')
  const [progresRealisasi, setProgresRealisasi] = useState('0')
  const [buktiPekerjaan, setBuktiPekerjaan] = useState('')

  const [sasaranOptions, setSasaranOptions] = useState([])
  const [indikatorOptions, setIndikatorOptions] = useState([])
  const [kegiatanOptions, setKegiatanOptions] = useState([])
  const [isLoadingSasaran, setIsLoadingSasaran] = useState(false)
  const [isLoadingIndikator, setIsLoadingIndikator] = useState(false)
  const [isLoadingKegiatan, setIsLoadingKegiatan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Selected kegiatan metadata
  const selectedKegiatanMeta = useMemo(() => {
    if (!kegiatanId || !kegiatanOptions.length) return null
    return kegiatanOptions.find((k) => String(k.id || k.value) === String(kegiatanId)) || null
  }, [kegiatanId, kegiatanOptions])

  // 1. Fetch Sasaran on open
  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    setIsLoadingSasaran(true)
    fetchIkkOptionsSasaran()
      .then((res) => {
        if (mounted) {
          const list = Array.isArray(res) ? res : []
          setSasaranOptions(list)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat opsi sasaran:', err)
        if (mounted) setSasaranOptions([])
      })
      .finally(() => {
        if (mounted) setIsLoadingSasaran(false)
      })
    return () => {
      mounted = false
    }
  }, [isOpen])

  // 2. Fetch Indikator when Sasaran changes
  useEffect(() => {
    if (!isOpen || !sasaranId) {
      setIndikatorOptions([])
      return
    }
    let mounted = true
    setIsLoadingIndikator(true)
    fetchIkkOptionsIndikator(sasaranId)
      .then((res) => {
        if (mounted) {
          const list = Array.isArray(res) ? res : []
          setIndikatorOptions(list)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat opsi indikator:', err)
        if (mounted) setIndikatorOptions([])
      })
      .finally(() => {
        if (mounted) setIsLoadingIndikator(false)
      })
    return () => {
      mounted = false
    }
  }, [isOpen, sasaranId])

  // 3. Fetch Kegiatan when Indikator changes
  useEffect(() => {
    if (!isOpen || !indikatorId) {
      setKegiatanOptions([])
      return
    }
    let mounted = true
    setIsLoadingKegiatan(true)
    fetchIkkOptionsKegiatan(indikatorId)
      .then((res) => {
        if (mounted) {
          const list = Array.isArray(res) ? res : []
          setKegiatanOptions(list)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat opsi kegiatan:', err)
        if (mounted) setKegiatanOptions([])
      })
      .finally(() => {
        if (mounted) setIsLoadingKegiatan(false)
      })
    return () => {
      mounted = false
    }
  }, [isOpen, indikatorId])

  // 4. Populate form if editing
  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setSasaranId(String(initialData.sasaran_id || ''))
      setIndikatorId(String(initialData.indikator_id || initialData.id_indikator || ''))
      setKegiatanId(String(initialData.kegiatan_id || ''))
      setPelaksanaHarian(
        initialData.pelaksana_kegiatan_harian || initialData.nama_kegiatan || initialData.uraian || ''
      )
      setPeriodStartDate(initialData.period_start_date || initialData.tanggal_kegiatan || today)
      setPeriodEndDate(
        initialData.period_end_date || initialData.period_start_date || initialData.tanggal_kegiatan || today
      )
      setTargetMingguan(String(initialData.target_mingguan ?? initialData.target ?? '100'))
      setJumlahRealisasi(String(initialData.jumlah_realisasi ?? initialData.realisasi ?? '0'))
      setProgresRealisasi(String(initialData.progres_realisasi ?? '0'))
      setBuktiPekerjaan(initialData.bukti_pekerjaan || initialData.link_eviden || initialData.eviden || '')
    } else {
      setSasaranId('')
      setIndikatorId('')
      setKegiatanId('')
      setPelaksanaHarian('')
      setPeriodStartDate(today)
      setPeriodEndDate(today)
      setTargetMingguan('100')
      setJumlahRealisasi('0')
      setProgresRealisasi('0')
      setBuktiPekerjaan('')
    }
    setErrorMsg('')
  }, [initialData, isOpen, today])

  // 5. Escape key handling
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  // Auto-calculate capaian percentage (dapat melampaui 100%)
  const handleTargetOrRealisasiChange = (nextTarget, nextRealisasi) => {
    const t = Number(nextTarget || 0)
    const r = Number(nextRealisasi || 0)
    if (t > 0) {
      const pct = Math.round((r / t) * 100 * 10) / 10
      setProgresRealisasi(String(pct))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!kegiatanId) {
      setErrorMsg('Silakan pilih Sasaran, Indikator, dan Kegiatan terlebih dahulu.')
      return
    }

    if (!pelaksanaHarian.trim() || pelaksanaHarian.trim().length < 3) {
      setErrorMsg('Uraian pelaksanaan kegiatan harian wajib diisi (minimal 3 karakter).')
      return
    }

    if (periodEndDate && periodStartDate && periodEndDate < periodStartDate) {
      setErrorMsg('Tanggal selesai tidak boleh lebih awal dari tanggal mulai periode.')
      return
    }

    const progresNum = Number(progresRealisasi)
    if (isNaN(progresNum) || progresNum < 0) {
      setErrorMsg('Progres capaian harus berupa angka valid (minimal 0%, dapat melebihi 100%).')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const payload = {
        kegiatan_id: kegiatanId,
        pelaksana_kegiatan_harian: pelaksanaHarian.trim(),
        period_start_date: periodStartDate,
        period_end_date: periodEndDate || periodStartDate,
        target_mingguan: Number(targetMingguan || 0),
        jumlah_realisasi: Number(jumlahRealisasi || 0),
        progres_realisasi: progresNum, // Mengizinkan angka > 100%
        bukti_pekerjaan: buktiPekerjaan.trim(),
      }

      if (initialData?.key || initialData?.id) {
        payload.key = initialData.key || initialData.id
      }

      const res = await storeIkkTransaksi(payload)
      if (res && res.status === 'error') {
        throw new Error(res.message || 'Gagal menyimpan transaksi IKK.')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan capaian transaksi IKK.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasNoPengampu =
    selectedKegiatanMeta &&
    (selectedKegiatanMeta.has_pengampu === 0 ||
      selectedKegiatanMeta.has_pengampu === '0' ||
      selectedKegiatanMeta.has_pengampu === false)

  const currentCapaian = Number(progresRealisasi || 0)
  const isOverAchieved = currentCapaian > 100

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Transaksi Capaian IKK' : 'Catat Capaian IKK Harian'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan realisasi kegiatan dan bukti eviden kinerja Kanreg III BKN
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto clean-scrollbar space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Cascading Sasaran via SearchableSelect */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                Sasaran Strategis Renstra <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Level 1</span>
            </label>
            <SearchableSelect
              options={sasaranOptions}
              value={sasaranId}
              onChange={(val) => {
                setSasaranId(val)
                setIndikatorId('')
                setKegiatanId('')
              }}
              placeholder="-- Ketik atau pilih Sasaran Strategis --"
              isLoading={isLoadingSasaran}
              isClearable
              required
            />
          </div>

          {/* 2. Cascading Indikator via SearchableSelect */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                Indikator Kinerja Kunci (IKK) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Level 2</span>
            </label>
            <SearchableSelect
              options={indikatorOptions}
              value={indikatorId}
              onChange={(val) => {
                setIndikatorId(val)
                setKegiatanId('')
              }}
              placeholder={
                sasaranId
                  ? '-- Ketik atau cari Indikator Kinerja --'
                  : '-- Pilih Sasaran terlebih dahulu --'
              }
              isLoading={isLoadingIndikator}
              isDisabled={!sasaranId}
              isClearable
              required
            />
          </div>

          {/* 3. Cascading Kegiatan via SearchableSelect */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                Kegiatan Operasional IKK <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Level 3</span>
            </label>
            <SearchableSelect
              options={kegiatanOptions}
              value={kegiatanId}
              onChange={(val) => setKegiatanId(val)}
              placeholder={
                indikatorId
                  ? '-- Ketik atau cari Kegiatan Operasional --'
                  : '-- Pilih Indikator terlebih dahulu --'
              }
              isLoading={isLoadingKegiatan}
              isDisabled={!indikatorId}
              isClearable
              required
            />
            {hasNoPengampu && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Perhatian: Kegiatan ini belum memiliki Tim Kerja Pengampu. Anda wajib menugaskan pengampu pada tab "Kegiatan & Pengampu" agar data valid.
                </span>
              </div>
            )}
          </div>

          {/* 4. Pelaksana Kegiatan Harian */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pelaksanaan Kegiatan Harian / Uraian Tugas <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={pelaksanaHarian}
              onChange={(e) => setPelaksanaHarian(e.target.value)}
              placeholder="Contoh: Pengolahan dan verifikasi berkas usulan kenaikan pangkat periode Oktober 2026"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-none"
            />
          </div>

          {/* 5. Periode Pelaksanaan (Start - End) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          {/* 6. Target, Realisasi & Progres Capaian (Bisa > 100%) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Volume Kinerja & Capaian
              </span>
              {isOverAchieved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Melampaui Target</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Mingguan
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetMingguan}
                  onChange={(e) => {
                    setTargetMingguan(e.target.value)
                    handleTargetOrRealisasiChange(e.target.value, jumlahRealisasi)
                  }}
                  required
                  placeholder="100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Jumlah Realisasi
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={jumlahRealisasi}
                  onChange={(e) => {
                    setJumlahRealisasi(e.target.value)
                    handleTargetOrRealisasiChange(targetMingguan, e.target.value)
                  }}
                  required
                  placeholder="100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Progres (%)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Bisa &gt;100%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={progresRealisasi}
                  onChange={(e) => setProgresRealisasi(e.target.value)}
                  required
                  placeholder="100"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    isOverAchieved
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                  } text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20`}
                />
              </div>
            </div>
          </div>

          {/* 7. Link Eviden / Bukti Pekerjaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tautan Bukti Pekerjaan / Eviden (Opsional)
            </label>
            <input
              type="url"
              value={buktiPekerjaan}
              onChange={(e) => setBuktiPekerjaan(e.target.value)}
              placeholder="https://drive.google.com/... atau tautan penyimpanan cloud"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Capaian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default IkkTransaksiModal
