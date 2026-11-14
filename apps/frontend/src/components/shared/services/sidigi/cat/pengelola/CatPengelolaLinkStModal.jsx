import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, FileCheck2 } from 'lucide-react'
import { SearchableSelect } from '../../../../../ui/SearchableSelect'
import {
  fetchCatPengelolaDocuments,
  linkCatPengelolaJadwalSt,
} from '../../../../../../services/api/sidigiCatServicesApi'

export function CatPengelolaLinkStModal({
  isOpen,
  onClose,
  onSuccess,
  jadwal = null,
}) {
  const [stDocs, setStDocs] = useState([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [nomorSt, setNomorSt] = useState('')
  const [tanggalSt, setTanggalSt] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen || !jadwal) return
    setErrorMsg('')
    setSelectedDocId(jadwal.st_document_id ? String(jadwal.st_document_id) : '')
    setNomorSt(jadwal.nomor_st || '')
    setTanggalSt(jadwal.tanggal_st || '')

    setLoadingDocs(true)
    fetchCatPengelolaDocuments({ doc_type: 'st', limit: 100 })
      .then((res) => {
        setStDocs(Array.isArray(res?.rows) ? res.rows : [])
      })
      .catch(() => setStDocs([]))
      .finally(() => setLoadingDocs(false))
  }, [isOpen, jadwal])

  const docOptions = useMemo(
    () =>
      stDocs.map((d) => ({
        value: String(d.id),
        label: `${d.doc_number || 'Draft ST'} — ${d.title}`,
        raw: d,
      })),
    [stDocs]
  )

  const handleSelectDoc = (docId, optionObj) => {
    setSelectedDocId(docId || '')
    const raw = optionObj?.raw
    if (raw) {
      if (raw.doc_number) setNomorSt(raw.doc_number)
      if (raw.doc_date) setTanggalSt(raw.doc_date)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jadwal) return
    if (!selectedDocId && !nomorSt.trim()) {
      setErrorMsg('Pilih dokumen Surat Tugas atau isi Nomor Surat Tugas terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      await linkCatPengelolaJadwalSt({
        jadwal_id: jadwal.id || jadwal.uid,
        st_document_id: selectedDocId ? Number(selectedDocId) : null,
        nomor_st: nomorSt.trim(),
        tanggal_st: tanggalSt || null,
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menautkan Surat Tugas ke jadwal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !jadwal) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-animated bg-slate-900/50 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="modal-dialog-animated w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Tautkan Surat Tugas (ST)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {jadwal.nama_jadwal}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Pilih dari Manajemen Dokumen (Tipe: Surat Tugas)
            </label>
            <SearchableSelect
              options={docOptions}
              value={selectedDocId}
              isLoading={loadingDocs}
              placeholder="Pilih Dokumen ST yang sudah dibuat (opsional)..."
              onChange={handleSelectDoc}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nomor Surat Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nomorSt}
                onChange={(e) => setNomorSt(e.target.value)}
                placeholder="Contoh: ST-098/KR.III/2026"
                className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Tanggal Surat Tugas
              </label>
              <input
                type="date"
                value={tanggalSt}
                onChange={(e) => setTanggalSt(e.target.value)}
                className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Menautkan ST pada jadwal akan otomatis memperbarui status ST seluruh anggota tim (Koordinator, IT, Pengawas) pada jadwal ini.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Menautkan...' : 'Tautkan ST'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
