import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Plus, Loader2, Save } from 'lucide-react'
import { fetchCatMasterJenisTes } from '../../../../../services/api/sidigiCatServicesApi'

export function CatJenisTesModal({
  isOpen,
  onClose,
  onSuccess,
  defaultYear,
  onSubmitFn,
}) {
  const [masterList, setMasterList] = useState([])
  const [selectedJenisId, setSelectedJenisId] = useState('')
  const [periode, setPeriode] = useState(defaultYear || new Date().getFullYear().toString())
  const [loadingMaster, setLoadingMaster] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadMaster = async () => {
    try {
      setLoadingMaster(true)
      const list = await fetchCatMasterJenisTes()
      setMasterList(Array.isArray(list) ? list : [])
    } catch (err) {
      console.warn('Gagal memuat master jenis tes CAT:', err)
      setMasterList([])
      setErrorMsg('Gagal memuat daftar master jenis tes dari server.')
    } finally {
      setLoadingMaster(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadMaster()
      setSelectedJenisId('')
      setPeriode(defaultYear || new Date().getFullYear().toString())
      setErrorMsg('')
    }
  }, [isOpen, defaultYear])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJenisId) {
      setErrorMsg('Pilih Jenis Tes terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      if (onSubmitFn) {
        await onSubmitFn({
          jenis_tes_id: selectedJenisId,
          periode: periode || new Date().getFullYear().toString(),
        })
      }
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan jenis tes tahunan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xl w-full max-w-md overflow-hidden modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Tambah Jenis Tes CAT Tahunan
              </h3>
              <p className="text-[11px] text-slate-500">Daftarkan agenda tes CAT untuk tahun pelaksanaan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Jenis Tes CAT <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedJenisId}
              onChange={(e) => setSelectedJenisId(e.target.value)}
              disabled={loadingMaster}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            >
              <option value="">-- Pilih Jenis Tes CAT --</option>
              {masterList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.kode ? `${m.kode} - ${m.nama}` : m.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 2026"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingMaster}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Daftarkan Jenis Tes</span>
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
