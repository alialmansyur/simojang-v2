import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Briefcase, AlertTriangle, Users, Check } from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import {
  storeIkkKegiatan,
  storeIkkPengampu,
  fetchIkkAssignedPengampu,
  fetchIkkOptionsIndikator,
  fetchIkkOptionsTimKerja,
} from '../../../../services/api/tuServicesApi'

export function IkkKegiatanModal({ isOpen, onClose, onSuccess, initialData }) {
  const [indikatorId, setIndikatorId] = useState('')
  const [noUrut, setNoUrut] = useState('')
  const [namaKegiatan, setNamaKegiatan] = useState('')
  const [satuan, setSatuan] = useState('')
  const [targetVolume, setTargetVolume] = useState('')
  const [selectedTimKerja, setSelectedTimKerja] = useState([])

  const [indikatorOptions, setIndikatorOptions] = useState([])
  const [timKerjaOptions, setTimKerjaOptions] = useState([])
  const [isLoadingIndikator, setIsLoadingIndikator] = useState(false)
  const [isLoadingTimKerja, setIsLoadingTimKerja] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    setIsLoadingIndikator(true)
    setIsLoadingTimKerja(true)

    Promise.all([
      fetchIkkOptionsIndikator(''),
      fetchIkkOptionsTimKerja(),
    ])
      .then(([indRes, timRes]) => {
        if (!mounted) return
        setIndikatorOptions(Array.isArray(indRes) ? indRes : [])
        setTimKerjaOptions(Array.isArray(timRes) ? timRes : [])
      })
      .catch((err) => {
        console.warn('Gagal memuat opsi indikator atau tim kerja:', err)
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingIndikator(false)
          setIsLoadingTimKerja(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      const kegId = initialData.key || initialData.id
      setIndikatorId(String(initialData.indikator_id || ''))
      setNoUrut(String(initialData.no_urut ?? ''))
      setNamaKegiatan(initialData.nama_kegiatan || '')
      setSatuan(initialData.satuan || '')
      setTargetVolume(String(initialData.target_volume ?? ''))

      // Fetch assigned tim kerja for this kegiatan
      if (kegId) {
        fetchIkkAssignedPengampu(kegId, 'kegiatan')
          .then((ids) => {
            if (Array.isArray(ids)) {
              setSelectedTimKerja(ids.map(Number))
            }
          })
          .catch(() => setSelectedTimKerja([]))
      }
    } else {
      setIndikatorId('')
      setNoUrut('')
      setNamaKegiatan('')
      setSatuan('')
      setTargetVolume('')
      setSelectedTimKerja([])
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const toggleTimKerja = (id) => {
    const numId = Number(id)
    setSelectedTimKerja((prev) =>
      prev.includes(numId) ? prev.filter((t) => t !== numId) : [...prev, numId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!indikatorId) {
      setErrorMsg('Indikator kinerja induk wajib dipilih.')
      return
    }
    if (!namaKegiatan.trim() || namaKegiatan.trim().length < 3) {
      setErrorMsg('Nama kegiatan operasional wajib diisi (minimal 3 karakter).')
      return
    }
    if (selectedTimKerja.length === 0) {
      setErrorMsg('Minimal pilih 1 Tim Kerja Pengampu untuk kegiatan ini.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const payload = {
        indikator_id: indikatorId,
        no_urut: noUrut ? Number(noUrut) : null,
        nama_kegiatan: namaKegiatan.trim(),
        satuan: satuan.trim(),
        target_volume: targetVolume.trim(),
      }

      if (initialData?.key || initialData?.id) {
        payload.key = initialData.key || initialData.id
      }

      const res = await storeIkkKegiatan(payload)
      if (res && res.status === 'error') {
        throw new Error(res.message || 'Gagal menyimpan kegiatan operasional.')
      }

      const savedId = res?.id || res?.data?.id || payload.key
      if (savedId) {
        await storeIkkPengampu({
          tipe_relasi: 'kegiatan',
          relasi_id: savedId,
          timkerja_ids: selectedTimKerja,
        })
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan kegiatan operasional.')
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Kegiatan Operasional' : 'Tambah Kegiatan Operasional'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pohon Kinerja Level 3 & Tim Pengampu • Kanreg III BKN
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Indikator Kinerja Induk <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={indikatorOptions}
              value={indikatorId}
              onChange={(val) => setIndikatorId(val)}
              placeholder="-- Pilih Indikator Kinerja Induk --"
              isLoading={isLoadingIndikator}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nama Kegiatan Operasional <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={namaKegiatan}
              onChange={(e) => setNamaKegiatan(e.target.value)}
              placeholder="Contoh: Fasilitasi Pelaksanaan Seleksi dengan Metode CAT BKN"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nomor Urut
              </label>
              <input
                type="number"
                min="1"
                value={noUrut}
                onChange={(e) => setNoUrut(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Satuan Ukur
              </label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                placeholder="Kegiatan / Laporan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Volume
              </label>
              <input
                type="text"
                value={targetVolume}
                onChange={(e) => setTargetVolume(e.target.value)}
                placeholder="10 Kegiatan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          {/* Tim Kerja Pengampu (Checkboxes) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Tim Kerja Pengampu Kegiatan <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] font-semibold text-[#175CD3] dark:text-blue-400">
                {selectedTimKerja.length} Tim Dipilih
              </span>
            </div>

            {isLoadingTimKerja ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                <span>Memuat daftar Tim Kerja...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timKerjaOptions.map((tim) => {
                  const id = Number(tim.id || tim.value)
                  const isChecked = selectedTimKerja.includes(id)
                  const label = tim.nama || tim.text || tim.label
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTimKerja(id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                        isChecked
                          ? 'border-[#175CD3] bg-blue-50/80 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate pr-2">{label}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-[#175CD3] border-[#175CD3] text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

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
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Kegiatan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default IkkKegiatanModal
