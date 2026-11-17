import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, Loader2, Save } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import { fetchInstansiOptions } from '../../../../../services/api/sidigiServicesApi'

export function CatQuickAddInstansiModal({
  isOpen,
  onClose,
  onSuccess,
  tilokId,
  tilokNama,
  onSubmitFn,
}) {
  const [masterInstansi, setMasterInstansi] = useState([])
  const [selectedInstansiId, setSelectedInstansiId] = useState('')
  const [loadingInstansi, setLoadingInstansi] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadMasterInstansi = async () => {
    try {
      setLoadingInstansi(true)
      setErrorMsg('')
      const list = await fetchInstansiOptions()
      setMasterInstansi(Array.isArray(list) ? list : [])
    } catch (err) {
      setMasterInstansi([])
      setErrorMsg(err.message || 'Gagal memuat daftar instansi dari server.')
    } finally {
      setLoadingInstansi(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadMasterInstansi()
      setSelectedInstansiId('')
      setErrorMsg('')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedInstansiId) {
      setErrorMsg('Pilih instansi peserta terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      if (onSubmitFn) {
        await onSubmitFn({
          tilok_id: tilokId,
          instansi_id: selectedInstansiId,
        })
      }
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftarkan instansi.')
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Daftarkan Instansi ke Tilok
              </h3>
              <p className="text-[11px] text-slate-500">{tilokNama || 'Pemetaan instansi peserta ujian'}</p>
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Instansi Pengusul / Peserta <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedInstansiId}
              onChange={(val) => {
                setSelectedInstansiId(val || '')
                if (val) setErrorMsg('')
              }}
              options={masterInstansi}
              placeholder="-- Cari atau Pilih Instansi Peserta --"
              isLoading={loadingInstansi}
              isDisabled={loadingInstansi || isSubmitting}
              noOptionsText="Tidak ada instansi yang sesuai"
              loadingText="Memuat data instansi..."
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Instansi yang didaftarkan akan langsung muncul pada filter instansi dan dapat dialokasikan jadwal sesi ujian di titik lokasi ini.
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
              disabled={isSubmitting || loadingInstansi}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Daftarkan Instansi</span>
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
