import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react'

export function WasdalBatchUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  serviceTitle = 'Layanan Wasdal',
  templateUrl = '/templates/wasdal/template-sistem-merit.xlsx',
  templateName = 'template-sistem-merit.xlsx',
  uploadApiFn,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file) => {
    setErrorMsg('')
    setSuccessMsg('')
    const validExtensions = ['.xlsx', '.xls']
    const ext = '.' + file.name.split('.').pop().toLowerCase()

    if (!validExtensions.includes(ext)) {
      setErrorMsg('Format file harus berupa spreadsheet Excel (.xlsx atau .xls)')
      setSelectedFile(null)
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file tidak boleh melebihi 15 MB.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg('Silakan pilih berkas spreadsheet terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      setSuccessMsg('')

      const result = await uploadApiFn(selectedFile)
      setSuccessMsg(result.message || 'Import data batch berhasil diproses!')

      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess()
        handleClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data batch.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setErrorMsg('')
    setSuccessMsg('')
    setIsSubmitting(false)
    onClose()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wasdal-batch-upload-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 id="wasdal-batch-upload-title" className="text-base font-bold text-slate-900 dark:text-white">
                Upload Data Batch — {serviceTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Impor banyak record data sekaligus melalui file spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download Banner */}
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
            href={templateUrl}
            download={templateName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0"
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
              ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
              : selectedFile
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
        {selectedFile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-[#175CD3] dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#175CD3] hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Mulai Import Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
