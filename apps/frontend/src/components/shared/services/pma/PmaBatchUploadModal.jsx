import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { resolveAssetUrl } from '../../../../utils/url'

export function PmaBatchUploadModal({
  isOpen,
  onClose,
  onSuccess,
  onUploadSuccess,
  serviceTitle = 'Layanan PMA',
  sampleFile = '/templates/pma/template-manajemen-talenta.xlsx',
  templateUrl,
  sampleFileName = 'template-pma.xlsx',
  templateName,
  uploadFn,
  uploadApiFn,
}) {
  const activeUploadFn = uploadFn || uploadApiFn
  const handleSuccessCallback = onSuccess || onUploadSuccess
  const activeTemplateUrl = templateUrl || sampleFile
  const activeTemplateName = templateName || sampleFileName

  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e) => {
      if (e.key === 'Escape' && !isUploading) {
        setFile(null)
        setErrorMsg('')
        setSuccessMsg('')
        onClose?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, isUploading, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (f) => {
    setErrorMsg('')
    setSuccessMsg('')
    if (!f) return

    const validExtensions = ['.xlsx', '.xls']
    const hasValidExt = validExtensions.some((ext) =>
      f.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidExt) {
      setErrorMsg('Format file tidak didukung. Harap unggah file .xlsx atau .xls.')
      setFile(null)
      return
    }

    if (f.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas maksimal 15 MB.')
      setFile(null)
      return
    }

    setFile(f)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg('Pilih berkas Excel terlebih dahulu.')
      return
    }

    if (!activeUploadFn || typeof activeUploadFn !== 'function') {
      setErrorMsg('Fungsi impor batch tidak tersedia.')
      return
    }

    try {
      setIsUploading(true)
      setErrorMsg('')
      setSuccessMsg('')

      const res = await activeUploadFn(file)
      setSuccessMsg(res.message || 'File batch berhasil diunggah dan diimpor!')

      setTimeout(() => {
        if (handleSuccessCallback) handleSuccessCallback()
        handleClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengunggah file batch.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setErrorMsg('')
    setSuccessMsg('')
    setIsUploading(false)
    onClose()
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Upload Data Batch ${serviceTitle}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) handleClose()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col modal-dialog-animated">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Data Batch (Excel)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {serviceTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleUpload} className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Template Download Banner (MANDATORY: Placed Above Dropzone as per SSOT) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                (activeTemplateUrl || '/templates/general/template-general.xlsx') +
                  ((activeTemplateUrl || '').includes('?') ? '&' : '?') +
                  `v=${Date.now()}`
              )}
              download={activeTemplateName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </a>
          </div>

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : file
                ? 'border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tarik & lepaskan file Excel di sini, atau{' '}
              <span className="text-emerald-600 dark:text-emerald-400 underline font-bold">
                pilih file
              </span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Format yang didukung: .xlsx, .xls (Maksimal 15 MB)
            </p>
          </div>

          {/* Selected File Badge */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Batalkan pilihan file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Mulai Impor Batch</span>
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
