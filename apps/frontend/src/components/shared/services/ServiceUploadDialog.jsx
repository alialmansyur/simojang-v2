import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react'
import { uploadServiceExcel } from '../../../services/api/modularServicesApi'
import { SearchableSelect } from '../../ui/SearchableSelect'
import { resolveAssetUrl } from '../../../utils/url'

export function ServiceUploadDialog({
  isOpen,
  onClose,
  layananId,
  serviceTitle,
  docType,
  categories = [],
  defaultCategory = '',
  sampleFile = '/templates/general/template-general.xlsx',
  sampleFileName,
  onSuccess,
}) {
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [syncdate1, setSyncdate1] = useState(() => new Date().toISOString().split('T')[0])
  const [syncdate2, setSyncdate2] = useState(() => new Date().toISOString().split('T')[0])
  const [docCategory, setDocCategory] = useState(defaultCategory)
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    setSyncdate1(todayStr)
    setSyncdate2(todayStr)
    setDocCategory(defaultCategory || (categories?.[0]?.value ?? ''))
    setRemarks('')
    setFile(null)
    setErrorMsg('')
  }, [isOpen, defaultCategory, categories])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleFileSelect = (selected) => {
    if (!selected) return
    if (!selected.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg('Format file harus berupa Excel (.xlsx atau .xls)')
      return
    }
    setErrorMsg('')
    setFile(selected)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    handleFileSelect(droppedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg('Silakan pilih file Excel terlebih dahulu.')
      return
    }
    if (categories.length > 0 && !docCategory) {
      setErrorMsg('Silakan pilih kategori dokumen usul.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('layanan_id', String(layananId))
      formData.append('doc_type', docType || serviceTitle)
      formData.append('doc_category', docCategory || '')
      formData.append('period', period)
      formData.append('syncdate1', syncdate1)
      formData.append('syncdate2', syncdate2)
      formData.append('remarks', remarks)

      await uploadServiceExcel(formData)
      toast.success('Berkas Excel berhasil diunggah dan diimpor.')
      if (onSuccess) onSuccess()
      onClose?.()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengunggah dan mengimpor file Excel.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-upload-modal-title"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div>
            <h2
              id="service-upload-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Upload Data Usul Baru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {serviceTitle} • Kantor Regional III BKN
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Tutup dialog upload"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto clean-scrollbar space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Grid 3 Kolom */}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={syncdate1}
                onChange={(e) => setSyncdate1(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={syncdate2}
                onChange={(e) => setSyncdate2(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          {/* Kategori Dokumen (Kondisional - e.g. Layanan 07 CLTN & Layanan 02 TAPNIP) */}
          {categories && categories.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori Usul Dokumen <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={categories}
                value={docCategory}
                onChange={(val) => setDocCategory(val || '')}
                placeholder="-- Pilih atau cari kategori usul --"
                required
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan Tambahan / Remarks (Opsional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`Contoh: Rekap ${serviceTitle} periode ${period}...`}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Template Download Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Format Excel Batch Resmi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Unduh template standar sebelum mengisi data
                </p>
              </div>
            </div>
            <a
              href={resolveAssetUrl(
                (sampleFile || '/templates/general/template-general.xlsx') +
                  ((sampleFile || '').includes('?') ? '&' : '?') +
                  `v=${Date.now()}`
              )}
              download={sampleFileName || (sampleFile ? sampleFile.split('?')[0].split('/').pop() : 'template-import.xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </a>
          </div>

          {/* Drag & Drop File Area */}
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                dragOver
                  ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
                  : file
                  ? 'border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tarik & lepaskan file Excel di sini, atau{' '}
                <span className="text-[#175CD3] dark:text-blue-400 underline font-bold">
                  pilih file
                </span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Format yang didukung: .xlsx, .xls (Maksimal 15 MB)
              </p>
            </div>

            {/* Selected File Badge */}
            {file && (
              <div className="flex items-center justify-between p-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • Klik area dropzone untuk mengganti file
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Batalkan pilihan file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah & Memproses...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Simpan & Import Data</span>
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
